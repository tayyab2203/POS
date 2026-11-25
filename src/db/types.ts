export type BusinessType = 'food' | 'retail' | 'bakery'
export type Language = 'en' | 'ur'
export type PrinterWidth = 58 | 80
export type PaymentMethod = 'cash' | 'online' | 'udhaar' | 'split'

export interface PaymentBreakdown {
  cash: number
  online: number
  udhaar: number
}

export type AuditAction =
  | 'BILL_VOIDED'
  | 'DISCOUNT_APPLIED'
  | 'PRICE_CHANGED'
  | 'PIN_FAILED_ATTEMPT'
  | 'TOKEN_RESET'
  | 'DATA_RESTORED'
  | 'STOCK_IN'

export const CUSTOM_PRODUCT_ID = '__custom__' as const

export const KITCHEN_PRESET_NOTES = [
  'Kam Mirch',
  'Extra Raita',
  'Separate Pack',
  'No Onion',
  'Extra Sauce',
  'Ziyada Mirch',
] as const
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'completed' | 'voided' | 'held'
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE'
export type SyncStatus = 'pending' | 'synced'
export type KhataType = 'debit' | 'credit'
export type ProductUnit = 'pcs' | 'kg' | 'g' | 'ltr' | 'ml' | 'plate' | 'portion'

export type SyncTableName =
  | 'settings'
  | 'categories'
  | 'products'
  | 'orders'
  | 'expenses'
  | 'customers'
  | 'khataTransactions'
  | 'dayClosings'
  | 'auditLogs'

export interface ReceiptConfig {
  showLogo: boolean
  showToken: boolean
  showOrderType: boolean
  showTax: boolean
  showSku: boolean
  showUdhaarBalance: boolean
  showItemDiscount: boolean
  autoPrintKot: boolean
  taxPercent: number
  footerMessage: string
}

export interface Settings {
  id: string
  shopName: string
  address: string
  phone: string
  logoBase64: string | null
  businessType: BusinessType
  printerWidth: PrinterWidth
  receiptConfig: ReceiptConfig
  ownerPin: string
  language: Language
  ownerWhatsApp: string
  currency: string
  openingCashDefault: number
  onboardingComplete: boolean
  lastTokenDate: string | null
  lastTokenNumber: number
  lastBackupAt: string | null
  /** Alert when tracked stock is at or below this value (default 5) */
  minStockAlert: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  costPrice: number
  sku?: string
}

export interface Product {
  id: string
  categoryId: string
  name: string
  price: number
  costPrice: number
  sku: string
  stock: number | null
  trackStock: boolean
  unit: ProductUnit
  allowFractional: boolean
  weightPresets: number[]
  imageBase64: string | null
  color: string
  variants: ProductVariant[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  variantId: string | null
  name: string
  unitPrice: number
  quantity: number
  discount: number
  lineTotal: number
  unit: ProductUnit
  notes?: string
}

export interface Order {
  id: string
  invoiceNumber: string
  tokenNumber: number | null
  orderType: OrderType | null
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  /** Amounts by tender; sums to `total` (legacy orders may omit — derive from paymentMethod) */
  paymentBreakdown: PaymentBreakdown
  cashReceived: number | null
  changeReturned: number | null
  customerId: string | null
  customerName: string | null
  previousBalance: number | null
  newBalance: number | null
  status: OrderStatus
  note: string
  /** Local calendar date YYYY-MM-DD for indexed range queries */
  localDate: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  action: AuditAction
  details: string
  performedBy: string
  createdAt: string
}

export interface Expense {
  id: string
  title: string
  category: string
  amount: number
  paymentMethod: Exclude<PaymentMethod, 'udhaar'>
  note: string
  localDate: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  balance: number
  note: string
  createdAt: string
  updatedAt: string
}

export interface KhataTransaction {
  id: string
  customerId: string
  orderId: string | null
  type: KhataType
  amount: number
  note: string
  localDate: string
  createdAt: string
}

export interface DayClosing {
  id: string
  date: string
  openingCash: number
  totalSales: number
  cashSales: number
  onlineSales: number
  udhaarSales: number
  totalExpenses: number
  khataCashReceived: number
  expectedCash: number
  actualCash: number | null
  notes: string
  createdAt: string
}

export interface SyncQueueItem {
  id: string
  tableName: SyncTableName
  recordId: string
  action: SyncAction
  payload: unknown
  status: SyncStatus
  createdAt: string
}

/** Tamper-evident local license snapshot (Phase 8C) */
export interface LicenseSnapshot {
  id: 'current'
  shopId: string
  shopName: string
  plan: 'basic' | 'pro'
  status: 'trial' | 'active' | 'grace' | 'suspended'
  expiresAt: string
  graceDays: number
  featureFlagsJson: string
  offlineSecret: string
  lastKnownTime: number
  checksum: string
  updatedAt: string
}

export const SETTINGS_ID = 'shop' as const

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  showLogo: true,
  showToken: true,
  showOrderType: true,
  showTax: false,
  showSku: false,
  showUdhaarBalance: true,
  showItemDiscount: true,
  autoPrintKot: true,
  taxPercent: 0,
  footerMessage: 'Thank you! Visit again',
}
