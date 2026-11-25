import Dexie, { type Table } from 'dexie'
import { todayKey } from '@/lib/format'
import type {
  AuditLog,
  Category,
  Customer,
  DayClosing,
  Expense,
  KhataTransaction,
  LicenseSnapshot,
  Order,
  PaymentBreakdown,
  Product,
  Settings,
  SyncQueueItem,
} from './types'

function defaultBreakdown(
  method: Order['paymentMethod'],
  total: number,
): PaymentBreakdown {
  const b: PaymentBreakdown = { cash: 0, online: 0, udhaar: 0 }
  if (method === 'cash') b.cash = total
  else if (method === 'online') b.online = total
  else if (method === 'udhaar') b.udhaar = total
  else b.cash = total
  return b
}

export function shopDbName(shopId: string): string {
  return `pos_db_${shopId}`
}

export const LOCAL_ONLY_DB_NAME = 'pos_db_local'

export class PosDatabase extends Dexie {
  settings!: Table<Settings, string>
  categories!: Table<Category, string>
  products!: Table<Product, string>
  orders!: Table<Order, string>
  expenses!: Table<Expense, string>
  customers!: Table<Customer, string>
  khataTransactions!: Table<KhataTransaction, string>
  dayClosings!: Table<DayClosing, string>
  syncQueue!: Table<SyncQueueItem, string>
  auditLogs!: Table<AuditLog, string>
  licenseSnapshots!: Table<LicenseSnapshot, string>

  constructor(dbName = LOCAL_ONLY_DB_NAME) {
    super(dbName)

    this.version(1).stores({
      settings: 'id',
      categories: 'id, sortOrder, name',
      products: 'id, categoryId, sku, name, isActive',
      orders: 'id, createdAt, status, invoiceNumber, customerId, paymentMethod',
      expenses: 'id, createdAt, category, paymentMethod',
      customers: 'id, name, phone, balance',
      khataTransactions: 'id, customerId, orderId, type, createdAt',
      dayClosings: 'id, date, createdAt',
      syncQueue: 'id, tableName, recordId, status, createdAt',
    })

    this.version(2)
      .stores({
        settings: 'id',
        categories: 'id, sortOrder, name',
        products: 'id, categoryId, sku, name, isActive, [isActive+name]',
        orders:
          'id, createdAt, status, invoiceNumber, customerId, paymentMethod, localDate, [localDate+status], [localDate+paymentMethod]',
        expenses: 'id, createdAt, category, paymentMethod, localDate',
        customers: 'id, name, phone, balance',
        khataTransactions:
          'id, customerId, orderId, type, createdAt, localDate, [customerId+createdAt], [localDate+type]',
        dayClosings: 'id, date, createdAt',
        syncQueue: 'id, tableName, recordId, status, createdAt',
      })
      .upgrade(async (tx) => {
        const orders = tx.table('orders')
        await orders.toCollection().modify((row: Order) => {
          if (!row.localDate) {
            row.localDate = todayKey(new Date(row.createdAt))
          }
        })

        const expenses = tx.table('expenses')
        await expenses.toCollection().modify((row: Expense) => {
          if (!row.localDate) {
            row.localDate = todayKey(new Date(row.createdAt))
          }
        })

        const khata = tx.table('khataTransactions')
        await khata.toCollection().modify((row: KhataTransaction) => {
          if (!row.localDate) {
            row.localDate = todayKey(new Date(row.createdAt))
          }
        })

        const settings = tx.table('settings')
        await settings.toCollection().modify((row: Settings) => {
          if (row.lastBackupAt === undefined) {
            row.lastBackupAt = null
          }
        })
      })

    this.version(3)
      .stores({
        settings: 'id',
        categories: 'id, sortOrder, name',
        products: 'id, categoryId, sku, name, isActive, [isActive+name]',
        orders:
          'id, createdAt, status, invoiceNumber, customerId, paymentMethod, localDate, [localDate+status], [localDate+paymentMethod]',
        expenses: 'id, createdAt, category, paymentMethod, localDate',
        customers: 'id, name, phone, balance',
        khataTransactions:
          'id, customerId, orderId, type, createdAt, localDate, [customerId+createdAt], [localDate+type]',
        dayClosings: 'id, date, createdAt',
        syncQueue: 'id, tableName, recordId, status, createdAt',
        auditLogs: 'id, action, createdAt, performedBy',
      })
      .upgrade(async (tx) => {
        const orders = tx.table('orders')
        await orders.toCollection().modify((row: Order) => {
          if (!row.paymentBreakdown) {
            row.paymentBreakdown = defaultBreakdown(
              row.paymentMethod,
              row.total,
            )
          }
        })

        const settings = tx.table('settings')
        await settings.toCollection().modify((row: Settings) => {
          if (row.minStockAlert === undefined || row.minStockAlert === null) {
            row.minStockAlert = 5
          }
        })
      })

    this.version(4).stores({
      settings: 'id',
      categories: 'id, sortOrder, name',
      products: 'id, categoryId, sku, name, isActive, [isActive+name]',
      orders:
        'id, createdAt, status, invoiceNumber, customerId, paymentMethod, localDate, [localDate+status], [localDate+paymentMethod]',
      expenses: 'id, createdAt, category, paymentMethod, localDate',
      customers: 'id, name, phone, balance',
      khataTransactions:
        'id, customerId, orderId, type, createdAt, localDate, [customerId+createdAt], [localDate+type]',
      dayClosings: 'id, date, createdAt',
      syncQueue: 'id, tableName, recordId, status, createdAt',
      auditLogs: 'id, action, createdAt, performedBy',
      licenseSnapshots: 'id, shopId',
    })
  }
}

let activeDb: PosDatabase = new PosDatabase(LOCAL_ONLY_DB_NAME)

/**
 * Stable export used across the app. Forwards to the active tenant DB so
 * switching shops never requires rewriting every import site.
 */
export const db: PosDatabase = new Proxy({} as PosDatabase, {
  get(_target, prop, _receiver) {
    const value = Reflect.get(activeDb, prop, activeDb)
    if (typeof value === 'function') {
      return value.bind(activeDb)
    }
    return value
  },
  set(_target, prop, value) {
    return Reflect.set(activeDb, prop, value, activeDb)
  },
})

export function getActiveDatabase(): PosDatabase {
  return activeDb
}

export function getActiveDbName(): string {
  return activeDb.name
}

/** Open (or switch to) the IndexedDB for a shop tenant. */
export async function switchShopDatabase(shopId: string): Promise<PosDatabase> {
  const name = shopDbName(shopId)
  if (activeDb.name === name && activeDb.isOpen()) {
    return activeDb
  }
  try {
    await activeDb.close()
  } catch {
    /* ignore close errors */
  }
  activeDb = new PosDatabase(name)
  await activeDb.open()
  return activeDb
}

/** Local-only / unconfigured cloud mode. */
export async function switchLocalDatabase(): Promise<PosDatabase> {
  if (activeDb.name === LOCAL_ONLY_DB_NAME && activeDb.isOpen()) {
    return activeDb
  }
  try {
    await activeDb.close()
  } catch {
    /* ignore */
  }
  activeDb = new PosDatabase(LOCAL_ONLY_DB_NAME)
  await activeDb.open()
  return activeDb
}

/** Migrate legacy single-tenant `LocalPosDB` into `pos_db_local` once. */
export async function migrateLegacyLocalDbIfNeeded(): Promise<void> {
  const legacy = await Dexie.exists('LocalPosDB')
  const modern = await Dexie.exists(LOCAL_ONLY_DB_NAME)
  if (!legacy || modern) return

  const oldDb = new PosDatabase('LocalPosDB')
  await oldDb.open()
  const newDb = new PosDatabase(LOCAL_ONLY_DB_NAME)
  await newDb.open()

  const tables = [
    'settings',
    'categories',
    'products',
    'orders',
    'expenses',
    'customers',
    'khataTransactions',
    'dayClosings',
    'syncQueue',
    'auditLogs',
  ] as const

  for (const table of tables) {
    try {
      const rows = await oldDb.table(table).toArray()
      if (rows.length) await newDb.table(table).bulkPut(rows)
    } catch {
      /* table may not exist on older schema */
    }
  }

  await oldDb.close()
  await newDb.close()
}
