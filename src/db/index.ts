import {
  db,
  migrateLegacyLocalDbIfNeeded,
  switchLocalDatabase,
  switchShopDatabase,
} from './schema'
import { ensureDefaultSettings } from './seed'
import { getPendingSyncCount } from './sync'

export {
  db,
  getActiveDatabase,
  getActiveDbName,
  LOCAL_ONLY_DB_NAME,
  migrateLegacyLocalDbIfNeeded,
  shopDbName,
  switchLocalDatabase,
  switchShopDatabase,
} from './schema'
export * from './types'
export * from './sync'
export * from './seed'
export * from './settings'
export * from './catalog'
export * from './orders'
export * from './expenses'
export * from './khata'
export * from './day-closing'
export * from './backup'
export * from './audit'
export * from './payment'

export interface DbInitResult {
  ready: boolean
  settingsId: string
  pendingSyncCount: number
}

export async function ensureInitialized(
  shopId?: string | null,
): Promise<DbInitResult> {
  await migrateLegacyLocalDbIfNeeded()

  if (shopId) {
    await switchShopDatabase(shopId)
  } else {
    await switchLocalDatabase()
  }

  await db.open()
  const settings = await ensureDefaultSettings()
  const pendingSyncCount = await getPendingSyncCount()

  return {
    ready: true,
    settingsId: settings.id,
    pendingSyncCount,
  }
}
