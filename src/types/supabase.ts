/** Cloud / Supabase row types — mirror `supabase/schema.sql` */

export type ShopPlan = 'basic' | 'pro'
export type ShopStatus = 'trial' | 'active' | 'grace' | 'suspended'
export type ProfileRole = 'super_admin' | 'shop_owner' | 'cashier'
export type PaymentMethodCloud = 'cash' | 'easypaisa' | 'jazzcash' | 'bank'
export type BusinessTypeCloud = 'food' | 'retail' | 'bakery'

export interface FeatureFlags {
  enableKhata: boolean
  enableWhatsAppReport: boolean
  enableAuditLog: boolean
  enableSplitPayment: boolean
  enableInventory: boolean
}

export const BASIC_FEATURE_FLAGS: FeatureFlags = {
  enableKhata: true,
  enableWhatsAppReport: true,
  enableAuditLog: false,
  enableSplitPayment: false,
  enableInventory: true,
}

export const PRO_FEATURE_FLAGS: FeatureFlags = {
  enableKhata: true,
  enableWhatsAppReport: true,
  enableAuditLog: true,
  enableSplitPayment: true,
  enableInventory: true,
}

export function defaultFeatureFlags(plan: ShopPlan): FeatureFlags {
  return plan === 'pro' ? { ...PRO_FEATURE_FLAGS } : { ...BASIC_FEATURE_FLAGS }
}

export interface ReceiptConfigCloud {
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

export interface ShopRow {
  id: string
  name: string
  owner_name: string
  owner_phone: string
  business_type: BusinessTypeCloud
  plan: ShopPlan
  status: ShopStatus
  expires_at: string
  grace_days: number
  feature_flags: FeatureFlags
  offline_secret: string
  last_sync_at: string | null
  address: string
  logo_base64: string | null
  receipt_config: ReceiptConfigCloud
  printer_width: 58 | 80
  currency: string
  language: 'en' | 'ur'
  opening_cash_default: number
  min_stock_alert: number
  owner_whatsapp: string
  created_at: string
}

export interface ProfileRow {
  id: string
  shop_id: string | null
  role: ProfileRole
  full_name: string
  phone: string
  created_at: string
}

export interface SubscriptionPaymentRow {
  id: string
  shop_id: string
  amount: number
  method: PaymentMethodCloud
  days_added: number
  note: string
  recorded_by: string | null
  created_at: string
}

export interface OperationalBase {
  id: string
  shop_id: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryRow extends OperationalBase {
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface ProductRow extends OperationalBase {
  category_id: string
  name: string
  price: number
  cost_price: number
  sku: string
  stock: number | null
  track_stock: boolean
  unit: string
  allow_fractional: boolean
  weight_presets: number[]
  image_base64: string | null
  color: string
  variants: unknown[]
  is_active: boolean
  created_at: string
}

export interface OrderRow extends OperationalBase {
  invoice_number: string
  token_number: number | null
  order_type: string | null
  items: unknown[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: string
  payment_breakdown: { cash: number; online: number; udhaar: number }
  cash_received: number | null
  change_returned: number | null
  customer_id: string | null
  customer_name: string | null
  previous_balance: number | null
  new_balance: number | null
  status: string
  note: string
  local_date: string
  created_at: string
}

export interface ExpenseRow extends OperationalBase {
  title: string
  category: string
  amount: number
  payment_method: string
  note: string
  local_date: string
  created_at: string
}

export interface CustomerRow extends OperationalBase {
  name: string
  phone: string
  balance: number
  note: string
  created_at: string
}

export interface KhataTransactionRow extends OperationalBase {
  customer_id: string
  order_id: string | null
  type: 'debit' | 'credit'
  amount: number
  note: string
  local_date: string
  created_at: string
}

export interface DayClosingRow extends OperationalBase {
  date: string
  opening_cash: number
  total_sales: number
  cash_sales: number
  online_sales: number
  udhaar_sales: number
  total_expenses: number
  khata_cash_received: number
  expected_cash: number
  actual_cash: number | null
  notes: string
  created_at: string
}

export interface AuditLogRow extends OperationalBase {
  action: string
  details: string
  performed_by: string
  created_at: string
}

export interface CreateShopOwnerRequest {
  shopName: string
  ownerName: string
  ownerPhone: string
  businessType: BusinessTypeCloud
  plan: ShopPlan
  trialDays?: number
  email: string
  password: string
  featureFlags?: Partial<FeatureFlags>
}

export interface CreateShopOwnerResponse {
  shopId: string
  userId: string
  email: string
  expiresAt: string
}
