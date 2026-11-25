import { todayKey } from '@/lib/format'

export type DatePreset = 'today' | '7days' | '30days' | 'custom'

export function daysAgoKey(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return todayKey(d)
}

export function presetToRange(
  preset: DatePreset,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const to = todayKey()
  if (preset === 'today') return { from: to, to }
  if (preset === '7days') return { from: daysAgoKey(6), to }
  if (preset === '30days') return { from: daysAgoKey(29), to }
  return {
    from: customFrom || daysAgoKey(6),
    to: customTo || to,
  }
}

export const PAGE_SIZE = 40
