import type { SyncAction, SyncQueueItem, SyncTableName } from '@/db/types'

/** Map local Dexie table names → Supabase table names */
export const REMOTE_TABLE: Record<SyncTableName, string> = {
  settings: 'shops',
  categories: 'categories',
  products: 'products',
  orders: 'orders',
  expenses: 'expenses',
  customers: 'customers',
  khataTransactions: 'khata_transactions',
  dayClosings: 'day_closings',
  auditLogs: 'audit_logs',
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>
  }
  return {}
}

function mapCategory(row: Record<string, unknown>, shopId: string) {
  return {
    id: row.id,
    shop_id: shopId,
    name: row.name,
    color: row.color ?? '#334155',
    sort_order: row.sortOrder ?? 0,
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

function mapProduct(row: Record<string, unknown>, shopId: string) {
  return {
    id: row.id,
    shop_id: shopId,
    category_id: row.categoryId,
    name: row.name,
    price: row.price ?? 0,
    cost_price: row.costPrice ?? 0,
    sku: row.sku ?? '',
    stock: row.stock ?? null,
    track_stock: row.trackStock ?? false,
    unit: row.unit ?? 'pcs',
    allow_fractional: row.allowFractional ?? false,
    weight_presets: row.weightPresets ?? [],
    image_base64: row.imageBase64 ?? null,
    color: row.color ?? '#334155',
    variants: row.variants ?? [],
    is_active: row.isActive ?? true,
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

function mapOrder(row: Record<string, unknown>, shopId: string) {
  return {
    id: row.id,
    shop_id: shopId,
    invoice_number: row.invoiceNumber,
    token_number: row.tokenNumber ?? null,
    order_type: row.orderType ?? null,
    items: row.items ?? [],
    subtotal: row.subtotal ?? 0,
    discount: row.discount ?? 0,
    tax: row.tax ?? 0,
    total: row.total ?? 0,
    payment_method: row.paymentMethod ?? 'cash',
    payment_breakdown: row.paymentBreakdown ?? {
      cash: 0,
      online: 0,
      udhaar: 0,
    },
    cash_received: row.cashReceived ?? null,
    change_returned: row.changeReturned ?? null,
    customer_id: row.customerId ?? null,
    customer_name: row.customerName ?? null,
    previous_balance: row.previousBalance ?? null,
    new_balance: row.newBalance ?? null,
    status: row.status ?? 'completed',
    note: row.note ?? '',
    local_date: row.localDate,
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

function mapExpense(row: Record<string, unknown>, shopId: string) {
  return {
    id: row.id,
    shop_id: shopId,
    title: row.title,
    category: row.category ?? 'Misc',
    amount: row.amount ?? 0,
    payment_method: row.paymentMethod ?? 'cash',
    note: row.note ?? '',
    local_date: row.localDate,
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

function mapCustomer(row: Record<string, unknown>, shopId: string) {
  return {
    id: row.id,
    shop_id: shopId,
    name: row.name,
    phone: row.phone ?? '',
    balance: row.balance ?? 0,
    note: row.note ?? '',
    created_at: row.createdAt ?? new Date().toISOString(),
    updated_at: row.updatedAt ?? new Date().toISOString(),
    deleted_at: null,
  }
}

function mapKhata(row: Record<string, unknown>, shopId: string) {
  const now = new Date().toISOString()
  return {
    id: row.id,
    shop_id: shopId,
    customer_id: row.customerId,
    order_id: row.orderId ?? null,
    type: row.type,
    amount: row.amount ?? 0,
    note: row.note ?? '',
    local_date: row.localDate,
    created_at: row.createdAt ?? now,
    updated_at: now,
    deleted_at: null,
  }
}

function mapDayClosing(row: Record<string, unknown>, shopId: string) {
  const now = new Date().toISOString()
  return {
    id: row.id,
    shop_id: shopId,
    date: row.date,
    opening_cash: row.openingCash ?? 0,
    total_sales: row.totalSales ?? 0,
    cash_sales: row.cashSales ?? 0,
    online_sales: row.onlineSales ?? 0,
    udhaar_sales: row.udhaarSales ?? 0,
    total_expenses: row.totalExpenses ?? 0,
    khata_cash_received: row.khataCashReceived ?? 0,
    expected_cash: row.expectedCash ?? 0,
    actual_cash: row.actualCash ?? null,
    notes: row.notes ?? '',
    created_at: row.createdAt ?? now,
    updated_at: now,
    deleted_at: null,
  }
}

function mapAudit(row: Record<string, unknown>, shopId: string) {
  const now = new Date().toISOString()
  return {
    id: row.id,
    shop_id: shopId,
    action: row.action,
    details: row.details ?? '',
    performed_by: row.performedBy ?? 'owner',
    created_at: row.createdAt ?? now,
    updated_at: now,
    deleted_at: null,
  }
}

/** Settings singleton → shops profile columns (never billing fields). */
export function mapSettingsToShopPatch(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    name: row.shopName ?? '',
    address: row.address ?? '',
    owner_phone: row.phone ?? '',
    owner_whatsapp: row.ownerWhatsApp ?? '',
    business_type: row.businessType,
    logo_base64: row.logoBase64 ?? null,
    receipt_config: row.receiptConfig ?? {},
    printer_width: row.printerWidth ?? 80,
    currency: row.currency ?? 'PKR',
    language: row.language ?? 'en',
    opening_cash_default: row.openingCashDefault ?? 0,
    min_stock_alert: row.minStockAlert ?? 5,
  }
}

export function mapQueueItemToRemote(
  item: SyncQueueItem,
  shopId: string,
): {
  table: string
  action: SyncAction
  recordId: string
  row: Record<string, unknown> | null
  isSettings: boolean
} {
  const table = REMOTE_TABLE[item.tableName]
  const payload = asRecord(item.payload)
  const recordId = item.recordId || String(payload.id ?? '')

  if (item.tableName === 'settings') {
    return {
      table: 'shops',
      action: item.action === 'DELETE' ? 'UPDATE' : item.action,
      recordId: shopId,
      row: mapSettingsToShopPatch(payload),
      isSettings: true,
    }
  }

  if (item.action === 'DELETE') {
    return {
      table,
      action: 'DELETE',
      recordId,
      row: {
        id: recordId,
        shop_id: shopId,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      isSettings: false,
    }
  }

  let row: Record<string, unknown>
  switch (item.tableName) {
    case 'categories':
      row = mapCategory(payload, shopId)
      break
    case 'products':
      row = mapProduct(payload, shopId)
      break
    case 'orders':
      row = mapOrder(payload, shopId)
      break
    case 'expenses':
      row = mapExpense(payload, shopId)
      break
    case 'customers':
      row = mapCustomer(payload, shopId)
      break
    case 'khataTransactions':
      row = mapKhata(payload, shopId)
      break
    case 'dayClosings':
      row = mapDayClosing(payload, shopId)
      break
    case 'auditLogs':
      row = mapAudit(payload, shopId)
      break
    default:
      row = { ...payload, shop_id: shopId }
  }

  return { table, action: item.action, recordId, row, isSettings: false }
}
