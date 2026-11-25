import { create } from 'zustand'
import {
  clearCachedSession,
  loadCachedSession,
  saveCachedSession,
  type CachedAuthSession,
  type CachedShopLicense,
} from '@/lib/auth-session'
import { getSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { FeatureFlags, ProfileRole, ShopRow } from '@/types/supabase'
import { defaultFeatureFlags } from '@/types/supabase'

interface AuthState {
  bootstrapped: boolean
  loading: boolean
  session: CachedAuthSession | null
  error: string | null
  bootstrap: () => Promise<void>
  signIn: (email: string, password: string) => Promise<CachedAuthSession>
  signOut: () => Promise<void>
  refreshShopLicense: () => Promise<CachedShopLicense | null>
  setSession: (session: CachedAuthSession | null) => void
}

function shopFromRow(row: ShopRow): CachedShopLicense {
  return {
    id: row.id,
    name: row.name,
    owner_name: row.owner_name,
    owner_phone: row.owner_phone,
    business_type: row.business_type,
    plan: row.plan,
    status: row.status,
    expires_at: row.expires_at,
    grace_days: row.grace_days ?? 7,
    feature_flags: (row.feature_flags ??
      defaultFeatureFlags(row.plan)) as FeatureFlags,
    offline_secret: row.offline_secret,
    address: row.address ?? '',
    owner_whatsapp: row.owner_whatsapp ?? '',
  }
}

async function fetchProfileAndShop(
  userId: string,
  email: string,
): Promise<CachedAuthSession> {
  const client = getSupabase()
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, shop_id, role, full_name, phone')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) throw new Error('Profile not found for this account')

  let shop: CachedShopLicense | null = null
  if (profile.shop_id) {
    const { data: shopRow, error: shopError } = await client
      .from('shops')
      .select('*')
      .eq('id', profile.shop_id)
      .maybeSingle()
    if (shopError) throw new Error(shopError.message)
    if (shopRow) shop = shopFromRow(shopRow as ShopRow)
  }

  const session: CachedAuthSession = {
    userId,
    email,
    role: profile.role as ProfileRole,
    shopId: profile.shop_id,
    fullName: profile.full_name ?? '',
    phone: profile.phone ?? '',
    shop,
    cachedAt: new Date().toISOString(),
  }
  saveCachedSession(session)
  return session
}

export const useAuthStore = create<AuthState>((set, get) => ({
  bootstrapped: false,
  loading: false,
  session: null,
  error: null,

  setSession: (session) => set({ session }),

  bootstrap: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ bootstrapped: true, session: null, loading: false })
      return
    }

    set({ loading: true, error: null })
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        const session = await fetchProfileAndShop(
          data.session.user.id,
          data.session.user.email ?? '',
        )
        set({ session, bootstrapped: true, loading: false })
        return
      }

      // Offline / no live session — use cached snapshot if present
      const cached = loadCachedSession()
      if (cached) {
        set({ session: cached, bootstrapped: true, loading: false })
        return
      }

      set({ session: null, bootstrapped: true, loading: false })
    } catch {
      const cached = loadCachedSession()
      set({
        session: cached,
        bootstrapped: true,
        loading: false,
        error: cached ? null : 'Unable to restore session',
      })
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured')
    }
    set({ loading: true, error: null })
    const client = getSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error || !data.user) {
      set({ loading: false, error: error?.message ?? 'Login failed' })
      throw new Error(error?.message ?? 'Login failed')
    }
    const session = await fetchProfileAndShop(
      data.user.id,
      data.user.email ?? email.trim(),
    )
    set({ session, loading: false, bootstrapped: true })
    return session
  },

  signOut: async () => {
    clearCachedSession()
    if (supabase) {
      try {
        await supabase.auth.signOut()
      } catch {
        /* offline logout is fine */
      }
    }
    set({ session: null, error: null })
  },

  refreshShopLicense: async () => {
    const current = get().session
    if (!current?.shopId || !isSupabaseConfigured) return current?.shop ?? null
    try {
      const client = getSupabase()
      const { data, error } = await client
        .from('shops')
        .select('*')
        .eq('id', current.shopId)
        .maybeSingle()
      if (error || !data) return current.shop
      const shop = shopFromRow(data as ShopRow)
      const next: CachedAuthSession = {
        ...current,
        shop,
        cachedAt: new Date().toISOString(),
      }
      saveCachedSession(next)
      set({ session: next })
      return shop
    } catch {
      return current.shop
    }
  },
}))
