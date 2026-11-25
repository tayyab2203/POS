/** Request durable storage so browsers are less likely to evict IndexedDB. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    const already = await navigator.storage.persisted?.()
    if (already) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

const BACKUP_KEY = 'local-pos-last-backup-at'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function markBackupExportedLocal(at = new Date().toISOString()): void {
  try {
    localStorage.setItem(BACKUP_KEY, at)
  } catch {
    /* ignore quota */
  }
}

export function getLastBackupAtLocal(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY)
  } catch {
    return null
  }
}

export function isBackupOverdue(lastBackupAt?: string | null): boolean {
  const last = lastBackupAt || getLastBackupAtLocal()
  if (!last) return true
  const ts = Date.parse(last)
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > SEVEN_DAYS_MS
}
