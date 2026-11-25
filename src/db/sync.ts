import { db } from './schema'
import type { SyncAction, SyncQueueItem, SyncTableName } from './types'

function nowIso(): string {
  return new Date().toISOString()
}

export async function enqueueSync(
  tableName: SyncTableName,
  recordId: string,
  action: SyncAction,
  payload: unknown,
): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    tableName,
    recordId,
    action,
    payload,
    status: 'pending',
    createdAt: nowIso(),
  }

  await db.syncQueue.add(item)
  return item
}

export async function withSyncWrite<T>(
  tableName: SyncTableName,
  recordId: string,
  action: SyncAction,
  writeFn: () => Promise<T>,
  payload?: unknown,
): Promise<T> {
  return db.transaction('rw', tableName, 'syncQueue', async () => {
    const result = await writeFn()
    await enqueueSync(tableName, recordId, action, payload ?? result)
    return result
  })
}

export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('status').equals('pending').sortBy('createdAt')
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  await db.transaction('rw', db.syncQueue, async () => {
    await Promise.all(
      ids.map((id) => db.syncQueue.update(id, { status: 'synced' })),
    )
  })
}

export async function clearSyncedQueue(): Promise<number> {
  return db.syncQueue.where('status').equals('synced').delete()
}
