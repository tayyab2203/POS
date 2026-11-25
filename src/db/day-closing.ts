import { todayKey } from '@/lib/format'
import { writeAuditLog } from './audit'
import { listExpensesForDate } from './expenses'
import { getKhataCashReceivedForDate } from './khata'
import { listOrders } from './orders'
import { orderPaymentAmounts } from './payment'
import { db } from './schema'
import { enqueueSync } from './sync'
import { SETTINGS_ID, type DayClosing, type Order, type Settings } from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

export interface DaySummary {
  date: string
  openingCash: number
  totalSales: number
  cashSales: number
  onlineSales: number
  udhaarSales: number
  totalExpenses: number
  cashExpenses: number
  khataCashReceived: number
  expectedCash: number
  orderCount: number
  voidedCount: number
  orders: Order[]
}

export async function computeDaySummary(
  date = todayKey(),
  openingCash = 0,
): Promise<DaySummary> {
  const orders = await listOrders({
    date,
    includeHeld: true,
    limit: 100_000,
  })

  const completed = orders.filter((o) => o.status === 'completed')
  const voidedCount = orders.filter((o) => o.status === 'voided').length

  let cashSales = 0
  let onlineSales = 0
  let udhaarSales = 0
  for (const o of completed) {
    const amounts = orderPaymentAmounts(o)
    cashSales += amounts.cash
    onlineSales += amounts.online
    udhaarSales += amounts.udhaar
  }
  const totalSales = cashSales + onlineSales + udhaarSales

  const expenses = await listExpensesForDate(date)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const cashExpenses = expenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0)

  const khataCashReceived = await getKhataCashReceivedForDate(date)
  const expectedCash =
    openingCash + cashSales + khataCashReceived - cashExpenses

  return {
    date,
    openingCash,
    totalSales,
    cashSales,
    onlineSales,
    udhaarSales,
    totalExpenses,
    cashExpenses,
    khataCashReceived,
    expectedCash,
    orderCount: completed.length,
    voidedCount,
    orders: completed.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export async function saveDayClosing(input: {
  summary: DaySummary
  actualCash: number | null
  notes?: string
}): Promise<DayClosing> {
  const existing = await db.dayClosings.where('date').equals(input.summary.date).first()

  const closing: DayClosing = {
    id: existing?.id ?? createId(),
    date: input.summary.date,
    openingCash: input.summary.openingCash,
    totalSales: input.summary.totalSales,
    cashSales: input.summary.cashSales,
    onlineSales: input.summary.onlineSales,
    udhaarSales: input.summary.udhaarSales,
    totalExpenses: input.summary.totalExpenses,
    khataCashReceived: input.summary.khataCashReceived,
    expectedCash: input.summary.expectedCash,
    actualCash: input.actualCash,
    notes: input.notes?.trim() ?? '',
    createdAt: existing?.createdAt ?? nowIso(),
  }

  await db.transaction(
    'rw',
    [db.dayClosings, db.settings, db.syncQueue, db.auditLogs],
    async () => {
      await db.dayClosings.put(closing)
      await enqueueSync(
        'dayClosings',
        closing.id,
        existing ? 'UPDATE' : 'CREATE',
        closing,
      )

      // Auto-reset token counter after day closing so next day starts at #1
      const settings = await db.settings.get(SETTINGS_ID)
      if (settings) {
        const nextSettings: Settings = {
          ...settings,
          lastTokenNumber: 0,
          lastTokenDate: null,
          updatedAt: nowIso(),
        }
        await db.settings.put(nextSettings)
        await enqueueSync('settings', nextSettings.id, 'UPDATE', nextSettings)
        await writeAuditLog({
          action: 'TOKEN_RESET',
          details: `Auto token reset after day closing ${closing.date}`,
          performedBy: 'system',
        })
      }
    },
  )

  return closing
}

function pkr(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`
}

function formatClosingDate(date: string): string {
  try {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

export function formatWhatsAppDayReport(
  summary: DaySummary,
  settings: Settings,
): string {
  const shop = settings.shopName || 'Local POS'
  const lines = [
    '========================',
    `*${shop}*`,
    `*Day Closing Report*`,
    formatClosingDate(summary.date),
    '========================',
    '',
    '*SALES*',
    `Orders: ${summary.orderCount}`,
    `Total Sales: *${pkr(summary.totalSales)}*`,
    `• Cash: ${pkr(summary.cashSales)}`,
    `• Online: ${pkr(summary.onlineSales)}`,
    `• Udhaar: ${pkr(summary.udhaarSales)}`,
    '',
    '*EXPENSES & KHATA*',
    `• Expenses: ${pkr(summary.totalExpenses)}`,
    `• Wasooli Received: ${pkr(summary.khataCashReceived)}`,
    '',
    '*CASH DRAWER*',
    `• Opening Cash: ${pkr(summary.openingCash)}`,
    `• Expected in Drawer: *${pkr(summary.expectedCash)}*`,
    '',
    '------------------------',
    '_Sent from Local POS_',
  ]

  // \r\n keeps line breaks reliable on Windows WhatsApp share sheets
  return lines.join('\r\n')
}

export function openWhatsAppReport(
  summary: DaySummary,
  settings: Settings,
): void {
  const text = formatWhatsAppDayReport(summary, settings)
  const phone = settings.ownerWhatsApp.replace(/\D/g, '')
  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
