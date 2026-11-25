import type {
  FeatureFlags,
  ProfileRole,
  ShopPlan,
  ShopStatus,
} from '@/types/supabase'

const SESSION_KEY = 'local-pos-cached-session'

export interface CachedShopLicense {
  id: string
  name: string
  owner_name: string
  owner_phone: string
  business_type: 'food' | 'retail' | 'bakery'
  plan: ShopPlan
  status: ShopStatus
  expires_at: string
  grace_days: number
  feature_flags: FeatureFlags
  offline_secret: string
  address: string
  owner_whatsapp: string
}

export interface CachedAuthSession {
  userId: string
  email: string
  role: ProfileRole
  shopId: string | null
  fullName: string
  phone: string
  shop: CachedShopLicense | null
  cachedAt: string
}

export function saveCachedSession(session: CachedAuthSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* quota */
  }
}

export function loadCachedSession(): CachedAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedAuthSession
    if (!parsed?.userId || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

export function clearCachedSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function updateCachedShopLicense(
  patch: Partial<CachedShopLicense>,
): CachedAuthSession | null {
  const current = loadCachedSession()
  if (!current?.shop) return current
  const next: CachedAuthSession = {
    ...current,
    shop: { ...current.shop, ...patch },
    cachedAt: new Date().toISOString(),
  }
  saveCachedSession(next)
  return next
}
