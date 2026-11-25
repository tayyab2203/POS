import { useLicenseStore } from '@/stores/license-store'
import type { FeatureFlags } from '@/types/supabase'
import { isSupabaseConfigured } from '@/lib/supabase'

export type FeatureFlagKey = keyof FeatureFlags

/** Returns whether a plan feature is enabled. Local-only mode → all enabled. */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  const unrestricted = useLicenseStore((s) => s.phase === 'unrestricted')
  const flags = useLicenseStore((s) => s.featureFlags)

  if (!isSupabaseConfigured || unrestricted) return true
  return Boolean(flags?.[flag])
}

export function useFeatureFlags(): FeatureFlags {
  const unrestricted = useLicenseStore((s) => s.phase === 'unrestricted')
  const flags = useLicenseStore((s) => s.featureFlags)
  if (!isSupabaseConfigured || unrestricted) {
    return {
      enableKhata: true,
      enableWhatsAppReport: true,
      enableAuditLog: true,
      enableSplitPayment: true,
      enableInventory: true,
    }
  }
  return flags
}
