import { todayKey } from '@/lib/format'
import { db } from './schema'
import { enqueueSync } from './sync'
import type { Expense, PaymentMethod } from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

export const EXPENSE_CATEGORIES = [
  'Raw material',
  'Gas',
  'Electricity',
  'Staff tea',
  'Rent',
  'Transport',
  'Misc',
] as const

export interface ExpenseInput {
  title: string
  category: string
  amount: number
  paymentMethod: Exclude<PaymentMethod, 'udhaar'>
  note: string
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const expense: Expense = {
    id: createId(),
    title: input.title.trim(),
    category: input.category,
    amount: Math.max(0, input.amount),
    paymentMethod: input.paymentMethod,
    note: input.note.trim(),
    localDate: todayKey(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await db.transaction('rw', db.expenses, db.syncQueue, async () => {
    await db.expenses.add(expense)
    await enqueueSync('expenses', expense.id, 'CREATE', expense)
  })

  return expense
}

export async function deleteExpense(id: string): Promise<void> {
  await db.transaction('rw', db.expenses, db.syncQueue, async () => {
    await db.expenses.delete(id)
    await enqueueSync('expenses', id, 'DELETE', { id })
  })
}

export interface ExpenseListOptions {
  from?: string
  to?: string
  date?: string
  offset?: number
  limit?: number
}

export async function listExpenses(
  options: ExpenseListOptions = {},
): Promise<Expense[]> {
  const from = options.date ?? options.from
  const to = options.date ?? options.to ?? from
  const offset = options.offset ?? 0
  const limit = options.limit ?? 500

  let rows: Expense[]

  if (from && to) {
    rows = await db.expenses
      .where('localDate')
      .between(from, to, true, true)
      .toArray()
  } else if (from) {
    rows = await db.expenses.where('localDate').equals(from).toArray()
  } else {
    const end = todayKey()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6)
    const start = todayKey(startDate)
    rows = await db.expenses
      .where('localDate')
      .between(start, end, true, true)
      .toArray()
  }

  if (from && to) {
    const missing = await db.expenses.filter((e) => !e.localDate).toArray()
    for (const e of missing) {
      const d = todayKey(new Date(e.createdAt))
      if (d >= from && d <= to) rows.push(e)
    }
  }

  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit)
}

export async function listExpensesForDate(date = todayKey()): Promise<Expense[]> {
  return listExpenses({ date, limit: 10_000 })
}
