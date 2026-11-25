import { create } from 'zustand'
import type { CachedShopLicense } from '@/lib/auth-session'
import { isSupabaseConfigured } from '@/lib/supabase'
import { verifyUnlockCode } from '@/lib/unlockCode'
import { getSupabase } from '@/lib/supabase'
import {
  bumpLastKnownTime,
  detectClockTamper,
  evaluateLicense,
  readLicenseSnapshot,
  verifySnapshotIntegrity,
  writeLicenseSnapshot,
  type LicenseEvaluation,
  type LicensePhase,
} from '@/services/licenseGuard'
import type { FeatureFlags } from '@/types/supabase'
import { defaultFeatureFlags } from '@/types/supabase'

interface LicenseState extends LicenseEvaluation {
  hydrated: boolean
  expiringBannerDismissed: boolean
  hydrateFromShop: (shop: CachedShopLicense | null) => Promise<void>
  refreshEvaluation: () => Promise<void>
  tickClock: (at?: number) => Promise<void>
  verifyOnlineNow: () => Promise<boolean>
  applyOfflineUnlock: (code: string) => Promise<{ ok: boolean; error?: string }>
  dismissExpiringBanner: () => void
  reset: () => void
}

const unrestrictedEval = evaluateLicense({
  snapshot: null,
  integrityOk: true,
  clockTampered: false,
  unrestricted: true,
})

export const useLicenseStore = create<LicenseState>((set, get) => ({
  ...unrestrictedEval,
  hydrated: false,
  expiringBannerDismissed: false,

  reset: () =>
    set({
      ...unrestrictedEval,
      hydrated: false,
      expiringBannerDismissed: false,
    }),

  dismissExpiringBanner: () => set({ expiringBannerDismissed: true }),

  hydrateFromShop: async (shop) => {
    if (!isSupabaseConfigured || !shop) {
      set({ ...unrestrictedEval, hydrated: true, expiringBannerDismissed: false })
      return
    }

    const now = Date.now()
    let snap = await readLicenseSnapshot()
    const clockTampered = snap
      ? detectClockTamper(snap.lastKnownTime, now)
      : false

    // Always rewrite snapshot from trusted cloud/session shop data when hydrating online path
    const lastKnown = Math.max(now, snap?.lastKnownTime ?? 0)
    snap = await writeLicenseSnapshot({
      shop,
      lastKnownTime: clockTampered ? snap!.lastKnownTime : lastKnown,
    })

    const integrityOk = await verifySnapshotIntegrity(snap)
    const evaluation = evaluateLicense({
      snapshot: snap,
      integrityOk,
      clockTampered: clockTampered || detectClockTamper(snap.lastKnownTime),
      unrestricted: false,
      supportPhone: shop.owner_whatsapp || shop.owner_phone,
    })

    set({
      ...evaluation,
      hydrated: true,
      expiringBannerDismissed:
        evaluation.phase === 'expiring_soon'
          ? get().expiringBannerDismissed
          : false,
    })
  },

  refreshEvaluation: async () => {
    const snap = await readLicenseSnapshot()
    if (!snap) {
      if (!isSupabaseConfigured) {
        set({ ...unrestrictedEval, hydrated: true })
      } else {
        set({
          phase: 'soft_locked' as LicensePhase,
          clockTampered: false,
          integrityOk: false,
          daysRemaining: null,
          graceDaysLeft: null,
          expiresAt: null,
          canCheckout: false,
          shopName: '',
          supportPhone: '',
          featureFlags: defaultFeatureFlags('basic'),
          snapshot: null,
          hydrated: true,
        })
      }
      return
    }

    const integrityOk = await verifySnapshotIntegrity(snap)
    const clockTampered = detectClockTamper(snap.lastKnownTime)
    let flags: FeatureFlags = defaultFeatureFlags(snap.plan)
    try {
      flags = JSON.parse(snap.featureFlagsJson) as FeatureFlags
    } catch {
      /* keep */
    }

    const evaluation = evaluateLicense({
      snapshot: snap,
      integrityOk,
      clockTampered,
      unrestricted: false,
      supportPhone: get().supportPhone,
    })

    set({
      ...evaluation,
      featureFlags: integrityOk ? evaluation.featureFlags : flags,
      hydrated: true,
    })
  },

  tickClock: async (at = Date.now()) => {
    if (!isSupabaseConfigured) return
    const updated = await bumpLastKnownTime(at)
    if (!updated) return
    // Compare against the same trusted clock we just wrote (server or local)
    if (detectClockTamper(updated.lastKnownTime, at)) {
      set({ clockTampered: true, canCheckout: false, phase: 'soft_locked' })
      return
    }
    await get().refreshEvaluation()
  },

  verifyOnlineNow: async () => {
    if (!isSupabaseConfigured) {
      set({ clockTampered: false, canCheckout: true, phase: 'unrestricted' })
      return true
    }
    try {
      const client = getSupabase()
      const { data, error } = await client.rpc('get_server_time')
      if (error) throw error
      const serverMs = data ? Date.parse(String(data)) : Date.now()
      const safeNow = Number.isFinite(serverMs) ? serverMs : Date.now()

      const snap = await readLicenseSnapshot()
      if (!snap) return false

      // Clear tamper by aligning lastKnownTime to trusted server time
      await writeLicenseSnapshot({
        shop: {
          id: snap.shopId,
          name: snap.shopName,
          owner_name: '',
          owner_phone: get().supportPhone,
          business_type: 'food',
          plan: snap.plan,
          status: snap.status,
          expires_at: snap.expiresAt,
          grace_days: snap.graceDays,
          feature_flags: JSON.parse(snap.featureFlagsJson) as FeatureFlags,
          offline_secret: snap.offlineSecret,
          address: '',
          owner_whatsapp: get().supportPhone,
        },
        lastKnownTime: safeNow,
      })

      await get().refreshEvaluation()
      return !get().clockTampered
    } catch {
      return false
    }
  },

  applyOfflineUnlock: async (code) => {
    const snap = await readLicenseSnapshot()
    if (!snap) return { ok: false, error: 'No license on this device' }

    const result = await verifyUnlockCode(
      code,
      snap.shopId,
      snap.offlineSecret,
    )
    if (!result.ok || !result.expiresAtIso) {
      return { ok: false, error: result.error ?? 'Invalid code' }
    }

    let flags: FeatureFlags = defaultFeatureFlags(snap.plan)
    try {
      flags = JSON.parse(snap.featureFlagsJson) as FeatureFlags
    } catch {
      /* keep */
    }

    await writeLicenseSnapshot({
      shop: {
        id: snap.shopId,
        name: snap.shopName,
        owner_name: '',
        owner_phone: get().supportPhone,
        business_type: 'food',
        plan: snap.plan,
        status: 'active',
        expires_at: result.expiresAtIso,
        grace_days: snap.graceDays,
        feature_flags: flags,
        offline_secret: snap.offlineSecret,
        address: '',
        owner_whatsapp: get().supportPhone,
      },
      lastKnownTime: Math.max(Date.now(), snap.lastKnownTime),
    })

    await get().refreshEvaluation()
    return { ok: true }
  },
}))
