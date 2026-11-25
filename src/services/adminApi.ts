import { getSupabase } from '@/lib/supabase'
import {
  defaultFeatureFlags,
  type FeatureFlags,
  type PaymentMethodCloud,
  type ShopPlan,
  type ShopRow,
  type ShopStatus,
  type SubscriptionPaymentRow,
} from '@/types/supabase'

export type ShopFilterTab =
  | 'all'
  | 'active'
  | 'trial'
  | 'expiring'
  | 'suspended'

export interface AdminKpis {
  totalShops: number
  activeShops: number
  trialShops: number
  expiringSoon: number
  suspended: number
  revenueThisMonth: number
}

export interface CreateShopOwnerInput {
  shopName: string
  ownerName: string
  ownerPhone: string
  businessType: 'food' | 'retail' | 'bakery'
  plan: ShopPlan
  trialDays: number
  email: string
  password: string
  featureFlags?: Partial<FeatureFlags>
}

export interface CreateShopOwnerResult {
  shopId: string
  userId: string
  email: string
  expiresAt: string
}

const EXPIRING_SOON_DAYS = 5

function addDaysIso(fromIso: string, days: number, floorNow = true): string {
  const fromMs = Date.parse(fromIso)
  const base = Number.isFinite(fromMs) ? fromMs : Date.now()
  const start = floorNow ? Math.max(base, Date.now()) : base
  return new Date(start + days * 24 * 60 * 60 * 1000).toISOString()
}

export function daysUntilExpiry(expiresAt: string, now = Date.now()): number {
  const ms = Date.parse(expiresAt) - now
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function isExpiringSoon(shop: ShopRow, now = Date.now()): boolean {
  if (shop.status === 'suspended') return false
  const days = daysUntilExpiry(shop.expires_at, now)
  return days >= 0 && days <= EXPIRING_SOON_DAYS
}

export function computeAdminKpis(
  shops: ShopRow[],
  revenueThisMonth: number,
  now = Date.now(),
): AdminKpis {
  return {
    totalShops: shops.length,
    activeShops: shops.filter((s) => s.status === 'active').length,
    trialShops: shops.filter((s) => s.status === 'trial').length,
    expiringSoon: shops.filter((s) => isExpiringSoon(s, now)).length,
    suspended: shops.filter((s) => s.status === 'suspended').length,
    revenueThisMonth,
  }
}

export function filterShops(
  shops: ShopRow[],
  tab: ShopFilterTab,
  query: string,
  now = Date.now(),
): ShopRow[] {
  const q = query.trim().toLowerCase()
  return shops.filter((shop) => {
    if (tab === 'active' && shop.status !== 'active') return false
    if (tab === 'trial' && shop.status !== 'trial') return false
    if (tab === 'suspended' && shop.status !== 'suspended') return false
    if (tab === 'expiring' && !isExpiringSoon(shop, now)) return false
    if (!q) return true
    return (
      shop.name.toLowerCase().includes(q) ||
      shop.owner_name.toLowerCase().includes(q) ||
      shop.owner_phone.toLowerCase().includes(q) ||
      shop.owner_whatsapp.toLowerCase().includes(q)
    )
  })
}

export async function fetchAllShops(): Promise<ShopRow[]> {
  const client = getSupabase()
  const { data, error } = await client
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ShopRow[]
}

export async function fetchMonthRevenue(now = new Date()): Promise<number> {
  const client = getSupabase()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const { data, error } = await client
    .from('subscription_payments')
    .select('amount')
    .gte('created_at', start.toISOString())
  if (error) throw new Error(error.message)
  return (data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount: number }).amount || 0),
    0,
  )
}

export async function fetchShopPayments(
  shopId: string,
): Promise<SubscriptionPaymentRow[]> {
  const client = getSupabase()
  const { data, error } = await client
    .from('subscription_payments')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return (data ?? []) as SubscriptionPaymentRow[]
}

export async function fetchRecentPayments(
  limit = 40,
): Promise<SubscriptionPaymentRow[]> {
  const client = getSupabase()
  const { data, error } = await client
    .from('subscription_payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as SubscriptionPaymentRow[]
}

export async function createShopOwner(
  input: CreateShopOwnerInput,
): Promise<CreateShopOwnerResult> {
  const client = getSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session?.access_token) throw new Error('Not signed in')

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-shop-owner`
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const json = (await res.json()) as CreateShopOwnerResult & { error?: string }
  if (!res.ok) {
    throw new Error(json.error || `Create shop failed (${res.status})`)
  }
  return json
}

export async function extendShopDays(
  shop: ShopRow,
  days: number,
  nextStatus: ShopStatus = 'active',
): Promise<ShopRow> {
  const client = getSupabase()
  const expires_at = addDaysIso(shop.expires_at, days, true)
  const { data, error } = await client
    .from('shops')
    .update({ expires_at, status: nextStatus })
    .eq('id', shop.id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ShopRow
}

export async function setShopStatus(
  shopId: string,
  status: ShopStatus,
): Promise<ShopRow> {
  const client = getSupabase()
  const { data, error } = await client
    .from('shops')
    .update({ status })
    .eq('id', shopId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ShopRow
}

export async function updateShopFeatureFlags(
  shopId: string,
  feature_flags: FeatureFlags,
): Promise<ShopRow> {
  const client = getSupabase()
  const { data, error } = await client
    .from('shops')
    .update({ feature_flags })
    .eq('id', shopId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ShopRow
}

export async function updateShopPlan(
  shopId: string,
  plan: ShopPlan,
  applyDefaultFlags: boolean,
): Promise<ShopRow> {
  const client = getSupabase()
  const patch: Partial<ShopRow> = { plan }
  if (applyDefaultFlags) {
    patch.feature_flags = defaultFeatureFlags(plan)
  }
  const { data, error } = await client
    .from('shops')
    .update(patch)
    .eq('id', shopId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ShopRow
}

export async function logSubscriptionPayment(input: {
  shop: ShopRow
  amount: number
  method: PaymentMethodCloud
  daysAdded: number
  note: string
  recordedBy: string | null
}): Promise<{ shop: ShopRow; payment: SubscriptionPaymentRow }> {
  const client = getSupabase()
  const expires_at = addDaysIso(input.shop.expires_at, input.daysAdded, true)

  const { data: payment, error: payError } = await client
    .from('subscription_payments')
    .insert({
      shop_id: input.shop.id,
      amount: input.amount,
      method: input.method,
      days_added: input.daysAdded,
      note: input.note,
      recorded_by: input.recordedBy,
    })
    .select('*')
    .single()

  if (payError) throw new Error(payError.message)

  const { data: shop, error: shopError } = await client
    .from('shops')
    .update({ expires_at, status: 'active' as ShopStatus })
    .eq('id', input.shop.id)
    .select('*')
    .single()

  if (shopError) throw new Error(shopError.message)

  return {
    shop: shop as ShopRow,
    payment: payment as SubscriptionPaymentRow,
  }
}

export function renewalWhatsAppUrl(shop: ShopRow, language: 'en' | 'ur'): string {
  const phone = (shop.owner_whatsapp || shop.owner_phone).replace(/\D/g, '')
  const expiry = new Date(shop.expires_at).toLocaleDateString()
  const text =
    language === 'ur'
      ? `السلام علیکم ${shop.owner_name}، آپ کی دکان "${shop.name}" کا لوکل پی او ایس لائسنس ${expiry} کو ختم ہو رہا / ہو چکا ہے۔ براہ کرم تجدید کروا لیں۔ شکریہ!`
      : `Assalam o Alaikum ${shop.owner_name}, your Local POS license for "${shop.name}" expires on ${expiry}. Please renew to keep billing unlocked. Thank you!`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
