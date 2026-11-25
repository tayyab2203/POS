import { todayKey } from '@/lib/format'
import type { CartLine } from '@/stores/cart-store'
import { writeAuditLog } from './audit'
import {
  breakdownFromMethod,
  breakdownSum,
  moneyEq,
  orderPaymentAmounts,
  primaryPaymentMethod,
} from './payment'
import { db } from './schema'
import { enqueueSync } from './sync'
import {
  CUSTOM_PRODUCT_ID,
  SETTINGS_ID,
  type Customer,
  type KhataTransaction,
  type Order,
  type OrderType,
  type PaymentBreakdown,
  type PaymentMethod,
  type Settings,
} from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

async function nextInvoiceNumber(): Promise<string> {
  const today = todayKey()
  const prefix = today.replaceAll('-', '')
  const todays = await db.orders.where('localDate').equals(today).count()
  return `INV-${prefix}-${String(todays + 1).padStart(4, '0')}`
}

async function nextTokenNumber(settings: Settings): Promise<{
  tokenNumber: number
  settingsPatch: Partial<Settings>
}> {
  const today = todayKey()
  const reset = settings.lastTokenDate !== today
  const tokenNumber = reset ? 1 : settings.lastTokenNumber + 1
  return {
    tokenNumber,
    settingsPatch: {
      lastTokenDate: today,
      lastTokenNumber: tokenNumber,
    },
  }
}

export async function resetTokenCounter(
  performedBy = 'owner',
): Promise<Settings> {
  const settings = await db.settings.get(SETTINGS_ID)
  if (!settings) throw new Error('Settings missing')

  const next: Settings = {
    ...settings,
    lastTokenNumber: 0,
    lastTokenDate: null,
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.settings, db.syncQueue, db.auditLogs, async () => {
    await db.settings.put(next)
    await enqueueSync('settings', next.id, 'UPDATE', next)
    await writeAuditLog({
      action: 'TOKEN_RESET',
      details: 'Token counter reset to #1 for next bill',
      performedBy,
    })
  })

  return next
}

export interface CheckoutInput {
  items: CartLine[]
  orderType: OrderType | null
  discount: number
  paymentMethod: PaymentMethod
  paymentBreakdown?: PaymentBreakdown | null
  splitPayment?: boolean
  cashReceived: number | null
  customerId: string | null
  customerName: string | null
  note?: string
  assignToken: boolean
}

export async function checkoutOrder(input: CheckoutInput): Promise<Order> {
  if (input.items.length === 0) {
    throw new Error('Cart is empty')
  }

  const settings = await db.settings.get(SETTINGS_ID)
  if (!settings) throw new Error('Settings missing')

  const subtotal = input.items.reduce((sum, line) => sum + line.lineTotal, 0)
  const discount = Math.max(0, input.discount)
  const taxPercent = settings.receiptConfig.taxPercent || 0
  const taxable = Math.max(0, subtotal - discount)
  const tax = settings.receiptConfig.showTax
    ? Math.round(((taxable * taxPercent) / 100) * 100) / 100
    : 0
  const total = Math.max(0, taxable + tax)

  let paymentBreakdown: PaymentBreakdown
  if (input.splitPayment && input.paymentBreakdown) {
    paymentBreakdown = {
      cash: Math.max(0, input.paymentBreakdown.cash || 0),
      online: Math.max(0, input.paymentBreakdown.online || 0),
      udhaar: Math.max(0, input.paymentBreakdown.udhaar || 0),
    }
    if (!moneyEq(breakdownSum(paymentBreakdown), total)) {
      throw new Error('Split payment must equal bill total')
    }
  } else if (input.paymentMethod === 'split' && input.paymentBreakdown) {
    paymentBreakdown = input.paymentBreakdown
  } else {
    const method =
      input.paymentMethod === 'split' ? 'cash' : input.paymentMethod
    paymentBreakdown = breakdownFromMethod(method, total)
  }

  const paymentMethod = primaryPaymentMethod(paymentBreakdown)
  const udhaarAmount = paymentBreakdown.udhaar

  if (udhaarAmount > 0 && !input.customerId) {
    throw new Error('Select a customer for Udhaar billing')
  }

  let cashReceived = input.cashReceived
  let changeReturned: number | null = null
  if (paymentBreakdown.cash > 0) {
    cashReceived = cashReceived ?? paymentBreakdown.cash
    changeReturned = Math.max(0, (cashReceived ?? paymentBreakdown.cash) - paymentBreakdown.cash)
  }

  const invoiceNumber = await nextInvoiceNumber()
  let tokenNumber: number | null = null
  let settingsPatch: Partial<Settings> = {}

  if (input.assignToken) {
    const token = await nextTokenNumber(settings)
    tokenNumber = token.tokenNumber
    settingsPatch = token.settingsPatch
  }

  let previousBalance: number | null = null
  let newBalance: number | null = null
  let customer: Customer | undefined

  if (udhaarAmount > 0 && input.customerId) {
    customer = await db.customers.get(input.customerId)
    if (!customer) throw new Error('Customer not found')
    previousBalance = customer.balance
    newBalance = customer.balance + udhaarAmount
  }

  const order: Order = {
    id: createId(),
    invoiceNumber,
    tokenNumber,
    orderType: input.orderType,
    items: input.items.map(({ lineId: _lineId, ...item }) => item),
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    paymentBreakdown,
    cashReceived,
    changeReturned,
    customerId: input.customerId,
    customerName: input.customerName ?? customer?.name ?? null,
    previousBalance,
    newBalance,
    status: 'completed',
    note: input.note ?? '',
    localDate: todayKey(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction(
    'rw',
    [
      db.orders,
      db.products,
      db.settings,
      db.customers,
      db.khataTransactions,
      db.syncQueue,
      db.auditLogs,
    ],
    async () => {
      await db.orders.add(order)
      await enqueueSync('orders', order.id, 'CREATE', order)

      for (const line of input.items) {
        if (line.productId === CUSTOM_PRODUCT_ID) continue
        const product = await db.products.get(line.productId)
        if (!product || !product.trackStock || product.stock === null) continue
        const nextStock = Math.max(0, product.stock - line.quantity)
        const updated = {
          ...product,
          stock: nextStock,
          updatedAt: nowIso(),
        }
        await db.products.put(updated)
        await enqueueSync('products', updated.id, 'UPDATE', updated)
      }

      if (customer && newBalance !== null && udhaarAmount > 0) {
        const nextCustomer: Customer = {
          ...customer,
          balance: newBalance,
          updatedAt: nowIso(),
        }
        const txn: KhataTransaction = {
          id: createId(),
          customerId: customer.id,
          orderId: order.id,
          type: 'debit',
          amount: udhaarAmount,
          note: `Bill ${order.invoiceNumber}${paymentMethod === 'split' ? ' (split udhaar)' : ''}`,
          localDate: todayKey(),
          createdAt: nowIso(),
        }
        await db.customers.put(nextCustomer)
        await db.khataTransactions.add(txn)
        await enqueueSync('customers', nextCustomer.id, 'UPDATE', nextCustomer)
        await enqueueSync('khataTransactions', txn.id, 'CREATE', txn)
      }

      if (Object.keys(settingsPatch).length > 0) {
        const nextSettings: Settings = {
          ...settings,
          ...settingsPatch,
          updatedAt: nowIso(),
        }
        await db.settings.put(nextSettings)
        await enqueueSync('settings', nextSettings.id, 'UPDATE', nextSettings)
      }

      if (discount > 0) {
        await writeAuditLog({
          action: 'DISCOUNT_APPLIED',
          details: `Discount ${discount} on ${order.invoiceNumber}`,
          performedBy: 'cashier',
        })
      }
    },
  )

  return order
}

export interface OrderListOptions {
  from?: string
  to?: string
  date?: string
  includeHeld?: boolean
  status?: Order['status']
  offset?: number
  limit?: number
}

export async function listOrders(
  options: OrderListOptions = {},
): Promise<Order[]> {
  const from = options.date ?? options.from
  const to = options.date ?? options.to ?? from
  const offset = options.offset ?? 0
  const limit = options.limit ?? 500

  let rows: Order[]

  if (from && to) {
    rows = await db.orders
      .where('localDate')
      .between(from, to, true, true)
      .toArray()
  } else if (from) {
    rows = await db.orders.where('localDate').equals(from).toArray()
  } else {
    const end = todayKey()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6)
    const start = todayKey(startDate)
    rows = await db.orders
      .where('localDate')
      .between(start, end, true, true)
      .toArray()
  }

  if (from && to) {
    const missing = await db.orders.filter((o) => !o.localDate).toArray()
    for (const o of missing) {
      const d = todayKey(new Date(o.createdAt))
      if (d >= from && d <= to) rows.push(o)
    }
  }

  return rows
    .filter((o) => {
      if (!options.includeHeld && o.status === 'held') return false
      if (options.status && o.status !== options.status) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit)
}

export async function countOrdersInRange(
  from: string,
  to: string,
  options?: { includeHeld?: boolean },
): Promise<number> {
  const rows = await listOrders({
    from,
    to,
    includeHeld: options?.includeHeld,
    limit: 100_000,
  })
  return rows.length
}

export async function voidOrder(id: string): Promise<Order> {
  const order = await db.orders.get(id)
  if (!order) throw new Error('Order not found')
  if (order.status === 'voided') throw new Error('Order already voided')
  if (order.status === 'held') throw new Error('Cannot void a held order')

  const next: Order = {
    ...order,
    status: 'voided',
    updatedAt: nowIso(),
  }

  const amounts = orderPaymentAmounts(order)
  const udhaarAmount = amounts.udhaar

  await db.transaction(
    'rw',
    [
      db.orders,
      db.products,
      db.customers,
      db.khataTransactions,
      db.syncQueue,
      db.auditLogs,
    ],
    async () => {
      await db.orders.put(next)
      await enqueueSync('orders', next.id, 'UPDATE', next)

      for (const line of order.items) {
        if (line.productId === CUSTOM_PRODUCT_ID) continue
        const product = await db.products.get(line.productId)
        if (!product || !product.trackStock || product.stock === null) continue
        const updated = {
          ...product,
          stock: product.stock + line.quantity,
          updatedAt: nowIso(),
        }
        await db.products.put(updated)
        await enqueueSync('products', updated.id, 'UPDATE', updated)
      }

      if (udhaarAmount > 0 && order.customerId) {
        const cust = await db.customers.get(order.customerId)
        if (cust) {
          const nextCustomer: Customer = {
            ...cust,
            balance: cust.balance - udhaarAmount,
            updatedAt: nowIso(),
          }
          const txn: KhataTransaction = {
            id: createId(),
            customerId: cust.id,
            orderId: order.id,
            type: 'credit',
            amount: udhaarAmount,
            note: `Void ${order.invoiceNumber}`,
            localDate: todayKey(),
            createdAt: nowIso(),
          }
          await db.customers.put(nextCustomer)
          await db.khataTransactions.add(txn)
          await enqueueSync('customers', nextCustomer.id, 'UPDATE', nextCustomer)
          await enqueueSync('khataTransactions', txn.id, 'CREATE', txn)
        }
      }

      await writeAuditLog({
        action: 'BILL_VOIDED',
        details: `Voided ${order.invoiceNumber} · ${order.total}`,
        performedBy: 'owner',
      })
    },
  )

  return next
}

export interface HeldCartPayload {
  items: CartLine[]
  orderType: OrderType | null
  discount: number
  paymentMethod: PaymentMethod
  paymentBreakdown?: PaymentBreakdown | null
  customerId: string | null
  customerName: string | null
  label: string
}

export async function holdOrder(payload: HeldCartPayload): Promise<Order> {
  if (payload.items.length === 0) {
    throw new Error('Cart is empty')
  }

  const subtotal = payload.items.reduce((sum, line) => sum + line.lineTotal, 0)
  const total = Math.max(0, subtotal - payload.discount)
  const invoiceNumber = await nextInvoiceNumber()
  const paymentBreakdown =
    payload.paymentBreakdown ??
    breakdownFromMethod(
      payload.paymentMethod === 'split' ? 'cash' : payload.paymentMethod,
      total,
    )

  const order: Order = {
    id: createId(),
    invoiceNumber,
    tokenNumber: null,
    orderType: payload.orderType,
    items: payload.items.map(({ lineId: _lineId, ...item }) => item),
    subtotal,
    discount: payload.discount,
    tax: 0,
    total,
    paymentMethod: primaryPaymentMethod(paymentBreakdown),
    paymentBreakdown,
    cashReceived: null,
    changeReturned: null,
    customerId: payload.customerId,
    customerName: payload.customerName,
    previousBalance: null,
    newBalance: null,
    status: 'held',
    note: payload.label,
    localDate: todayKey(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.orders, db.syncQueue, async () => {
    await db.orders.add(order)
    await enqueueSync('orders', order.id, 'CREATE', order)
  })

  return order
}

export async function listHeldOrders(): Promise<Order[]> {
  const rows = await db.orders.where('status').equals('held').toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteHeldOrder(id: string): Promise<void> {
  await db.transaction('rw', db.orders, db.syncQueue, async () => {
    await db.orders.delete(id)
    await enqueueSync('orders', id, 'DELETE', { id })
  })
}

export async function resumeHeldOrder(id: string): Promise<Order> {
  const order = await db.orders.get(id)
  if (!order || order.status !== 'held') {
    throw new Error('Held order not found')
  }
  await deleteHeldOrder(id)
  return order
}
