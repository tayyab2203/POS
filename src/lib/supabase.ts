import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

function looksConfigured(u: string, key: string): boolean {
  if (!u || !key) return false
  if (u.includes('YOUR_PROJECT_REF')) return false
  if (key.includes('your_anon')) return false
  try {
    const parsed = new URL(u)
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost'
  } catch {
    return false
  }
}

/** True when public Supabase env vars are present and look valid. */
export const isSupabaseConfigured = looksConfigured(url, anonKey)

/**
 * Browser Supabase client (anon key only).
 * Null when unconfigured / offline-first without cloud — never throws on import.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Use for optional online paths that require a configured project. */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}
