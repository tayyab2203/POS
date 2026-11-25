import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { KITCHEN_PRESET_NOTES } from '@/db'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

interface KitchenNotesDialogProps {
  open: boolean
  itemName: string
  initialNotes: string
  onOpenChange: (open: boolean) => void
  onSave: (notes: string) => void
}

export function KitchenNotesDialog({
  open,
  itemName,
  initialNotes,
  onOpenChange,
  onSave,
}: KitchenNotesDialogProps) {
  const { t, dir } = useI18n()
  const [notes, setNotes] = useState(initialNotes)

  useEffect(() => {
    if (open) setNotes(initialNotes)
  }, [open, initialNotes])

  function togglePreset(preset: string) {
    const parts = notes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.includes(preset)) {
      setNotes(parts.filter((p) => p !== preset).join(', '))
    } else {
      setNotes([...parts, preset].join(', '))
    }
  }

  const active = new Set(
    notes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('kitchenNotes')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{itemName}</p>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_PRESET_NOTES.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                active.has(preset)
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-400',
              )}
              onClick={() => togglePreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          value={notes}
          placeholder={t('customNote')}
          onChange={(e) => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              onSave(notes.trim())
              onOpenChange(false)
            }}
          >
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
