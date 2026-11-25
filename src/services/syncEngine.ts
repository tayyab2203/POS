import { db, getPendingSyncItems, markSynced } from '@/db'
import { updateCachedShopLicense } from '@/lib/auth-session'
import { getSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { useLicenseStore } from '@/stores/license-store'
import type { FeatureFlags, ShopRow } from '@/types/supabase'
import { mapQueueItemToRemote } from './sync-mapper'

const BATCH_SIZE = 50
const INTERVAL_MS = 2 * 60 * 1000

let running = false
let started = false
let intervalId: number | null = null
let backoffMs = 1000
const MAX_BACKOFF = 60_000

type SyncListener = (state: {
  syncing: boolean
  lastError: string | null
  lastSuccessAt: string | null
}) => void

const listeners = new Set<SyncListener>()
let lastError: string | null = null
let lastSuccessAt: string | null = null

function emit() {
  const snapshot = { syncing: running, lastError, lastSuccessAt }
  for (const listener of listeners) listener(snapshot)
}

export function subscribeSyncEngine(listener: SyncListener): () => void {
  listeners.add(listener)
  listener({ syncing: running, lastError, lastSuccessAt })
  return () => listeners.delete(listener)
}

async function pushBatch(shopId: string): Promise<number> {
  const client = getSupabase()
  const pending = await getPendingSyncItems()
  const batch = pending.slice(0, BATCH_SIZE)
  if (batch.length === 0) return 0

  const syncedIds: string[] = []

  for (const item of batch) {
    const mapped = mapQueueItemToRemote(item, shopId)
    if (!mapped.recordId) {
      syncedIds.push(item.id)
      continue
    }

    if (mapped.isSettings) {
      const { error } = await client
        .from('shops')
        .update(mapped.row!)
        .eq('id', shopId)
      if (error) throw new Error(error.message)
      syncedIds.push(item.id)
      continue
    }

    if (item.action === 'DELETE') {
      const { error } = await client.from(mapped.table).upsert(mapped.row!, {
        onConflict: 'id',
      })
      if (error) throw new Error(error.message)
      syncedIds.push(item.id)
      continue
    }

    const { error } = await client.from(mapped.table).upsert(mapped.row!, {
      onConflict: 'id',
    })
    if (error) throw new Error(error.message)
    syncedIds.push(item.id)
  }

  await markSynced(syncedIds)
  return syncedIds.length
}

async function refreshLicenseSnapshot(shopId: string): Promise<void> {
  const client = getSupabase()
  const { data: serverTime } = await client.rpc('get_server_time')
  const serverMs = serverTime
    ? Date.parse(String(serverTime))
    : Date.now()
  const trustedNow = Number.isFinite(serverMs) ? serverMs : Date.now()

  const nowIso = new Date().toISOString()
  await client.from('shops').update({ last_sync_at: nowIso }).eq('id', shopId)

  const { data: shop } = await client
    .from('shops')
    .select(
      'id, name, owner_name, owner_phone, business_type, plan, status, expires_at, grace_days, feature_flags, offline_secret, address, owner_whatsapp, last_sync_at',
    )
    .eq('id', shopId)
    .maybeSingle()

  if (shop) {
    const row = shop as ShopRow
    const license = {
      id: row.id,
      name: row.name,
      owner_name: row.owner_name,
      owner_phone: row.owner_phone,
      business_type: row.business_type,
      plan: row.plan,
      status: row.status,
      expires_at: row.expires_at,
      grace_days: row.grace_days,
      feature_flags: row.feature_flags as FeatureFlags,
      offline_secret: row.offline_secret,
      address: row.address,
      owner_whatsapp: row.owner_whatsapp,
    }
    updateCachedShopLicense(license)
    const current = useAuthStore.getState().session
    if (current) {
      const prev = current.shop
      const unchanged =
        prev &&
        prev.id === license.id &&
        prev.expires_at === license.expires_at &&
        prev.status === license.status &&
        prev.plan === license.plan &&
        prev.grace_days === license.grace_days &&
        prev.offline_secret === license.offline_secret &&
        JSON.stringify(prev.feature_flags) ===
          JSON.stringify(license.feature_flags)
      if (!unchanged) {
        useAuthStore.getState().setSession({
          ...current,
          shop: license,
          cachedAt: new Date().toISOString(),
        })
      }
    }
    await useLicenseStore.getState().hydrateFromShop(license)
    await useLicenseStore.getState().tickClock(trustedNow)
  }
}

export async function runSyncNow(): Promise<{ pushed: number }> {
  if (!isSupabaseConfigured || !supabase) {
    return { pushed: 0 }
  }
  if (!navigator.onLine) {
    lastError = 'Offline'
    emit()
    return { pushed: 0 }
  }

  const auth = useAuthStore.getState().session
  const shopId = auth?.shopId
  if (!shopId || auth.role === 'super_admin') {
    return { pushed: 0 }
  }

  if (running) return { pushed: 0 }
  running = true
  lastError = null
  emit()

  let pushed = 0
  try {
    // Drain queue in FIFO batches until empty or a failure
    for (;;) {
      const n = await pushBatch(shopId)
      pushed += n
      if (n === 0) break
    }
    await refreshLicenseSnapshot(shopId)
    lastSuccessAt = new Date().toISOString()
    backoffMs = 1000
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Sync failed'
    backoffMs = Math.min(MAX_BACKOFF, backoffMs * 2)
    window.setTimeout(() => {
      void runSyncNow()
    }, backoffMs)
  } finally {
    running = false
    emit()
  }

  return { pushed }
}

export function startSyncEngine(): void {
  if (started) return
  started = true

  const kick = () => {
    if (navigator.onLine) void runSyncNow()
  }

  kick()
  window.addEventListener('online', kick)
  intervalId = window.setInterval(kick, INTERVAL_MS)
}

export function stopSyncEngine(): void {
  started = false
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

/** Expose pending count helper for UI (uses live Dexie). */
export async function countPendingSync(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}
