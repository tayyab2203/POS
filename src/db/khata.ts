import { todayKey } from '@/lib/format'
import { db } from './schema'
import { enqueueSync } from './sync'
import type { Customer, KhataTransaction } from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

export interface CustomerInput {
  name: string
  phone: string
  note?: string
}

export async function listCustomers(): Promise<Customer[]> {
  const rows = await db.customers.toArray()
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const customer: Customer = {
    id: createId(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    balance: 0,
    note: input.note?.trim() ?? '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.customers, db.syncQueue, async () => {
    await db.customers.add(customer)
    await enqueueSync('customers', customer.id, 'CREATE', customer)
  })

  return customer
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, 'name' | 'phone' | 'note'>>,
): Promise<Customer> {
  const existing = await db.customers.get(id)
  if (!existing) throw new Error('Customer not found')

  const next: Customer = {
    ...existing,
    ...patch,
    name: patch.name?.trim() ?? existing.name,
    phone: patch.phone?.trim() ?? existing.phone,
    note: patch.note?.trim() ?? existing.note,
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.customers, db.syncQueue, async () => {
    await db.customers.put(next)
    await enqueueSync('customers', next.id, 'UPDATE', next)
  })

  return next
}

export async function deleteCustomer(id: string): Promise<void> {
  const customer = await db.customers.get(id)
  if (!customer) return
  if (Math.abs(customer.balance) > 0.001) {
    throw new Error('Clear customer balance before deleting')
  }

  await db.transaction(
    'rw',
    db.customers,
    db.khataTransactions,
    db.syncQueue,
    async () => {
      await db.khataTransactions.where('customerId').equals(id).delete()
      await db.customers.delete(id)
      await enqueueSync('customers', id, 'DELETE', { id })
    },
  )
}

export async function listKhataTransactions(
  customerId: string,
  options?: { from?: string; to?: string; offset?: number; limit?: number },
): Promise<KhataTransaction[]> {
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 200
  let rows = await db.khataTransactions
    .where('customerId')
    .equals(customerId)
    .toArray()

  if (options?.from || options?.to) {
    const from = options.from ?? '0000-01-01'
    const to = options.to ?? '9999-12-31'
    rows = rows.filter((row) => {
      const d = row.localDate || todayKey(new Date(row.createdAt))
      return d >= from && d <= to
    })
  }

  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit)
}

/** Record cash collection (Wasooli) — reduces customer balance */
export async function recordWasooli(input: {
  customerId: string
  amount: number
  note?: string
}): Promise<{ customer: Customer; transaction: KhataTransaction }> {
  const amount = Math.max(0, input.amount)
  if (amount <= 0) throw new Error('Amount must be greater than 0')

  const customer = await db.customers.get(input.customerId)
  if (!customer) throw new Error('Customer not found')

  const transaction: KhataTransaction = {
    id: createId(),
    customerId: customer.id,
    orderId: null,
    type: 'credit',
    amount,
    note: input.note?.trim() || 'Wasooli / Cash received',
    localDate: todayKey(),
    createdAt: nowIso(),
  }

  const nextCustomer: Customer = {
    ...customer,
    balance: customer.balance - amount,
    updatedAt: nowIso(),
  }

  await db.transaction(
    'rw',
    db.customers,
    db.khataTransactions,
    db.syncQueue,
    async () => {
      await db.customers.put(nextCustomer)
      await db.khataTransactions.add(transaction)
      await enqueueSync('customers', nextCustomer.id, 'UPDATE', nextCustomer)
      await enqueueSync(
        'khataTransactions',
        transaction.id,
        'CREATE',
        transaction,
      )
    },
  )

  return { customer: nextCustomer, transaction }
}

export async function getKhataCashReceivedForDate(
  date: string,
): Promise<number> {
  const rows = await db.khataTransactions
    .where('localDate')
    .equals(date)
    .toArray()
  return rows
    .filter((row) => row.type === 'credit' && !row.orderId)
    .reduce((sum, row) => sum + row.amount, 0)
}
