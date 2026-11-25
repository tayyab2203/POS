import { markBackupExportedLocal } from '@/lib/storage'
import { writeAuditLog } from './audit'
import { db } from './schema'
import type {
  AuditLog,
  Category,
  Customer,
  DayClosing,
  Expense,
  KhataTransaction,
  Order,
  Product,
  Settings,
  SyncQueueItem,
} from './types'

export interface FullBackup {
  version: 1
  exportedAt: string
  settings: Settings[]
  categories: Category[]
  products: Product[]
  orders: Order[]
  expenses: Expense[]
  customers: Customer[]
  khataTransactions: KhataTransaction[]
  dayClosings: DayClosing[]
  syncQueue: SyncQueueItem[]
  auditLogs?: AuditLog[]
}

export async function exportFullBackup(): Promise<FullBackup> {
  const [
    settings,
    categories,
    products,
    orders,
    expenses,
    customers,
    khataTransactions,
    dayClosings,
    syncQueue,
    auditLogs,
  ] = await Promise.all([
    db.settings.toArray(),
    db.categories.toArray(),
    db.products.toArray(),
    db.orders.toArray(),
    db.expenses.toArray(),
    db.customers.toArray(),
    db.khataTransactions.toArray(),
    db.dayClosings.toArray(),
    db.syncQueue.toArray(),
    db.auditLogs.toArray(),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    categories,
    products,
    orders,
    expenses,
    customers,
    khataTransactions,
    dayClosings,
    syncQueue,
    auditLogs,
  }
}

export async function markBackupExported(): Promise<void> {
  const settings = await db.settings.toArray()
  const now = new Date().toISOString()
  await Promise.all(
    settings.map((s) =>
      db.settings.put({ ...s, lastBackupAt: now, updatedAt: now }),
    ),
  )
}

export async function downloadBackupFile(): Promise<void> {
  const backup = await exportFullBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `local-pos-backup-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  await markBackupExported()
  markBackupExportedLocal()
}

export async function restoreFullBackup(backup: FullBackup): Promise<void> {
  if (!backup || backup.version !== 1) {
    throw new Error('Invalid backup file')
  }

  await db.transaction(
    'rw',
    [
      db.settings,
      db.categories,
      db.products,
      db.orders,
      db.expenses,
      db.customers,
      db.khataTransactions,
      db.dayClosings,
      db.syncQueue,
      db.auditLogs,
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.categories.clear(),
        db.products.clear(),
        db.orders.clear(),
        db.expenses.clear(),
        db.customers.clear(),
        db.khataTransactions.clear(),
        db.dayClosings.clear(),
        db.syncQueue.clear(),
        db.auditLogs.clear(),
      ])

      if (backup.settings?.length) {
        await db.settings.bulkPut(
          backup.settings.map((s) => ({
            ...s,
            minStockAlert: s.minStockAlert ?? 5,
            lastBackupAt: s.lastBackupAt ?? null,
          })),
        )
      }
      if (backup.categories?.length)
        await db.categories.bulkPut(backup.categories)
      if (backup.products?.length) await db.products.bulkPut(backup.products)
      if (backup.orders?.length) {
        await db.orders.bulkPut(
          backup.orders.map((o) => ({
            ...o,
            paymentBreakdown: o.paymentBreakdown ?? {
              cash: o.paymentMethod === 'cash' ? o.total : 0,
              online: o.paymentMethod === 'online' ? o.total : 0,
              udhaar: o.paymentMethod === 'udhaar' ? o.total : 0,
            },
            localDate: o.localDate || o.createdAt.slice(0, 10),
          })),
        )
      }
      if (backup.expenses?.length) await db.expenses.bulkPut(backup.expenses)
      if (backup.customers?.length) await db.customers.bulkPut(backup.customers)
      if (backup.khataTransactions?.length)
        await db.khataTransactions.bulkPut(backup.khataTransactions)
      if (backup.dayClosings?.length)
        await db.dayClosings.bulkPut(backup.dayClosings)
      if (backup.syncQueue?.length) await db.syncQueue.bulkPut(backup.syncQueue)
      if (backup.auditLogs?.length) await db.auditLogs.bulkPut(backup.auditLogs)
    },
  )

  await writeAuditLog({
    action: 'DATA_RESTORED',
    details: `Restored backup from ${backup.exportedAt}`,
    performedBy: 'owner',
  })
}

export async function restoreBackupFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as FullBackup
  await restoreFullBackup(parsed)
}
