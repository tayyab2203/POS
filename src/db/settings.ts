import { db } from './schema'
import { buildDefaultSettings } from './seed'
import { enqueueSync } from './sync'
import {
  SETTINGS_ID,
  type Language,
  type Settings,
} from './types'

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  const settings = buildDefaultSettings()
  await db.settings.put(settings)
  return settings
}

export async function updateSettings(
  patch: Partial<Omit<Settings, 'id' | 'createdAt'>>,
): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    ...current,
    ...patch,
    id: SETTINGS_ID,
    updatedAt: new Date().toISOString(),
  }

  await db.transaction('rw', db.settings, db.syncQueue, async () => {
    await db.settings.put(next)
    await enqueueSync('settings', next.id, 'UPDATE', next)
  })

  return next
}

export async function updateLanguage(language: Language): Promise<Settings> {
  return updateSettings({ language })
}
