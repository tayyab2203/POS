import { db } from './schema'
import { enqueueSync } from './sync'
import type { AuditAction, AuditLog } from './types'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

export async function writeAuditLog(input: {
  action: AuditAction
  details: string
  performedBy?: string
}): Promise<AuditLog> {
  const entry: AuditLog = {
    id: createId(),
    action: input.action,
    details: input.details,
    performedBy: input.performedBy ?? 'owner',
    createdAt: nowIso(),
  }
  await db.transaction('rw', db.auditLogs, db.syncQueue, async () => {
    await db.auditLogs.add(entry)
    await enqueueSync('auditLogs', entry.id, 'CREATE', entry)
  })
  return entry
}

export async function listAuditLogs(options?: {
  action?: AuditAction | 'all'
  limit?: number
}): Promise<AuditLog[]> {
  const limit = options?.limit ?? 200
  let rows = await db.auditLogs
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray()
  if (options?.action && options.action !== 'all') {
    rows = rows.filter((r) => r.action === options.action)
  }
  return rows
}
