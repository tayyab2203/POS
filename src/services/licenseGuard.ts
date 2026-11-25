import { db } from '@/db'
import type { LicenseSnapshot } from '@/db/types'
import type { CachedShopLicense } from '@/lib/auth-session'
import { licenseChecksum } from '@/lib/unlockCode'
import type { FeatureFlags } from '@/types/supabase'
import { defaultFeatureFlags } from '@/types/supabase'

export type LicensePhase =
  | 'unrestricted'
  | 'active'
  | 'expiring_soon'
  | 'grace'
  | 'soft_locked'

export interface LicenseEvaluation {
  phase: LicensePhase
  clockTampered: boolean
  integrityOk: boolean
  daysRemaining: number | null
  graceDaysLeft: number | null
  expiresAt: string | null
  canCheckout: boolean
  shopName: string
  supportPhone: string
  featureFlags: FeatureFlags
  snapshot: LicenseSnapshot | null
}

const CLOCK_TOLERANCE_MS = 5 * 60 * 1000
const EXPIRING_SOON_DAYS = 5
const SNAPSHOT_ID = 'current' as const

export async function readLicenseSnapshot(): Promise<LicenseSnapshot | null> {
  try {
    return (await db.licenseSnapshots.get(SNAPSHOT_ID)) ?? null
  } catch {
    return null
  }
}

export async function writeLicenseSnapshot(input: {
  shop: CachedShopLicense
  lastKnownTime: number
}): Promise<LicenseSnapshot> {
  const featureFlagsJson = JSON.stringify(input.shop.feature_flags)
  const checksum = await licenseChecksum({
    shopId: input.shop.id,
    offlineSecret: input.shop.offline_secret,
    expiresAt: input.shop.expires_at,
    status: input.shop.status,
    graceDays: input.shop.grace_days,
    plan: input.shop.plan,
    lastKnownTime: input.lastKnownTime,
    featureFlagsJson,
  })

  const row: LicenseSnapshot = {
    id: SNAPSHOT_ID,
    shopId: input.shop.id,
    shopName: input.shop.name,
    plan: input.shop.plan,
    status: input.shop.status,
    expiresAt: input.shop.expires_at,
    graceDays: input.shop.grace_days,
    featureFlagsJson,
    offlineSecret: input.shop.offline_secret,
    lastKnownTime: input.lastKnownTime,
    checksum,
    updatedAt: new Date().toISOString(),
  }

  await db.licenseSnapshots.put(row)
  return row
}

export async function verifySnapshotIntegrity(
  snap: LicenseSnapshot,
): Promise<boolean> {
  const expected = await licenseChecksum({
    shopId: snap.shopId,
    offlineSecret: snap.offlineSecret,
    expiresAt: snap.expiresAt,
    status: snap.status,
    graceDays: snap.graceDays,
    plan: snap.plan,
    lastKnownTime: snap.lastKnownTime,
    featureFlagsJson: snap.featureFlagsJson,
  })
  return expected === snap.checksum
}

export function detectClockTamper(
  lastKnownTime: number,
  now = Date.now(),
): boolean {
  if (!lastKnownTime) return false
  return now < lastKnownTime - CLOCK_TOLERANCE_MS
}

export function evaluateLicense(options: {
  snapshot: LicenseSnapshot | null
  integrityOk: boolean
  clockTampered: boolean
  /** Local-only / no SaaS → never lock */
  unrestricted: boolean
  supportPhone?: string
}): LicenseEvaluation {
  if (options.unrestricted) {
    return {
      phase: 'unrestricted',
      clockTampered: false,
      integrityOk: true,
      daysRemaining: null,
      graceDaysLeft: null,
      expiresAt: null,
      canCheckout: true,
      shopName: '',
      supportPhone: options.supportPhone ?? '',
      featureFlags: defaultFeatureFlags('pro'),
      snapshot: null,
    }
  }

  const snap = options.snapshot
  let flags: FeatureFlags = defaultFeatureFlags('basic')
  if (snap?.featureFlagsJson) {
    try {
      flags = JSON.parse(snap.featureFlagsJson) as FeatureFlags
    } catch {
      /* keep default */
    }
  }

  if (!snap || !options.integrityOk) {
    return {
      phase: 'soft_locked',
      clockTampered: options.clockTampered,
      integrityOk: options.integrityOk,
      daysRemaining: null,
      graceDaysLeft: null,
      expiresAt: snap?.expiresAt ?? null,
      canCheckout: false,
      shopName: snap?.shopName ?? '',
      supportPhone: options.supportPhone ?? '',
      featureFlags: flags,
      snapshot: snap,
    }
  }

  if (options.clockTampered) {
    return {
      phase: 'soft_locked',
      clockTampered: true,
      integrityOk: true,
      daysRemaining: null,
      graceDaysLeft: null,
      expiresAt: snap.expiresAt,
      canCheckout: false,
      shopName: snap.shopName,
      supportPhone: options.supportPhone ?? '',
      featureFlags: flags,
      snapshot: snap,
    }
  }

  if (snap.status === 'suspended') {
    return {
      phase: 'soft_locked',
      clockTampered: false,
      integrityOk: true,
      daysRemaining: 0,
      graceDaysLeft: 0,
      expiresAt: snap.expiresAt,
      canCheckout: false,
      shopName: snap.shopName,
      supportPhone: options.supportPhone ?? '',
      featureFlags: flags,
      snapshot: snap,
    }
  }

  const now = Date.now()
  const expiresMs = Date.parse(snap.expiresAt)
  const graceEnd = expiresMs + snap.graceDays * 24 * 60 * 60 * 1000
  const msLeft = expiresMs - now
  const daysRemaining = Math.ceil(msLeft / (24 * 60 * 60 * 1000))

  if (now <= expiresMs) {
    const phase: LicensePhase =
      daysRemaining <= EXPIRING_SOON_DAYS ? 'expiring_soon' : 'active'
    return {
      phase,
      clockTampered: false,
      integrityOk: true,
      daysRemaining: Math.max(0, daysRemaining),
      graceDaysLeft: null,
      expiresAt: snap.expiresAt,
      canCheckout: true,
      shopName: snap.shopName,
      supportPhone: options.supportPhone ?? '',
      featureFlags: flags,
      snapshot: snap,
    }
  }

  if (now <= graceEnd) {
    const graceDaysLeft = Math.max(
      0,
      Math.ceil((graceEnd - now) / (24 * 60 * 60 * 1000)),
    )
    return {
      phase: 'grace',
      clockTampered: false,
      integrityOk: true,
      daysRemaining: 0,
      graceDaysLeft,
      expiresAt: snap.expiresAt,
      canCheckout: true,
      shopName: snap.shopName,
      supportPhone: options.supportPhone ?? '',
      featureFlags: flags,
      snapshot: snap,
    }
  }

  return {
    phase: 'soft_locked',
    clockTampered: false,
    integrityOk: true,
    daysRemaining: 0,
    graceDaysLeft: 0,
    expiresAt: snap.expiresAt,
    canCheckout: false,
    shopName: snap.shopName,
    supportPhone: options.supportPhone ?? '',
    featureFlags: flags,
    snapshot: snap,
  }
}

export async function bumpLastKnownTime(
  nextTime = Date.now(),
): Promise<LicenseSnapshot | null> {
  const snap = await readLicenseSnapshot()
  if (!snap) return null
  if (nextTime <= snap.lastKnownTime) return snap

  const checksum = await licenseChecksum({
    shopId: snap.shopId,
    offlineSecret: snap.offlineSecret,
    expiresAt: snap.expiresAt,
    status: snap.status,
    graceDays: snap.graceDays,
    plan: snap.plan,
    lastKnownTime: nextTime,
    featureFlagsJson: snap.featureFlagsJson,
  })

  const updated: LicenseSnapshot = {
    ...snap,
    lastKnownTime: nextTime,
    checksum,
    updatedAt: new Date().toISOString(),
  }
  await db.licenseSnapshots.put(updated)
  return updated
}
