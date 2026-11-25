import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'
import {
  type DatePreset,
  presetToRange,
} from '@/lib/date-range'

interface DateRangeToolbarProps {
  preset: DatePreset
  from: string
  to: string
  onPresetChange: (preset: DatePreset) => void
  onFromChange: (from: string) => void
  onToChange: (to: string) => void
  count?: number
}

export function DateRangeToolbar({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
  count,
}: DateRangeToolbarProps) {
  const { t } = useI18n()

  function applyPreset(next: DatePreset) {
    onPresetChange(next)
    if (next !== 'custom') {
      const range = presetToRange(next)
      onFromChange(range.from)
      onToChange(range.to)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {(
        [
          ['today', t('today')],
          ['7days', t('last7Days')],
          ['30days', t('last30Days')],
          ['custom', t('customRange')],
        ] as const
      ).map(([id, label]) => (
        <Button
          key={id}
          type="button"
          size="sm"
          variant={preset === id ? 'default' : 'outline'}
          onClick={() => applyPreset(id)}
        >
          {label}
        </Button>
      ))}
      {preset === 'custom' ? (
        <>
          <Input
            type="date"
            className="w-36"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
          <Input
            type="date"
            className="w-36"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </>
      ) : null}
      {typeof count === 'number' ? (
        <span className="ms-auto text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  )
}
