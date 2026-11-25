import { Delete, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { writeAuditLog } from '@/db'
import { useI18n } from '@/i18n'
import { useSessionStore } from '@/stores'
import { cn } from '@/lib/utils'

interface OwnerPinModalProps {
  ownerPin: string
}

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function OwnerPinModal({ ownerPin }: OwnerPinModalProps) {
  const { t, dir } = useI18n()
  const open = useSessionStore((s) => s.pinModalOpen)
  const closePinModal = useSessionStore((s) => s.closePinModal)
  const unlockOwner = useSessionStore((s) => s.unlockOwner)
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!open) setPin('')
  }, [open])

  function submit(nextPin: string) {
    if (nextPin.length !== 4) return
    if (nextPin === ownerPin) {
      unlockOwner()
      toast.success(t('ownerMode'))
      setPin('')
      return
    }
    setShake(true)
    toast.error(t('pinIncorrect'))
    void writeAuditLog({
      action: 'PIN_FAILED_ATTEMPT',
      details: 'Failed owner PIN attempt',
      performedBy: 'unknown',
    })
    window.setTimeout(() => {
      setShake(false)
      setPin('')
    }, 350)
  }

  function onDigit(digit: string) {
    if (digit === 'del') {
      setPin((prev) => prev.slice(0, -1))
      return
    }
    if (!digit || pin.length >= 4) return
    const next = `${pin}${digit}`
    setPin(next)
    if (next.length === 4) submit(next)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closePinModal()
      }}
    >
      <DialogContent className="max-w-sm" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('enterOwnerPin')}
          </DialogTitle>
          <DialogDescription>{t('ownerPinHint')}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'mx-auto flex gap-3 py-2',
            shake && 'animate-pulse',
          )}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-semibold',
                pin.length > index
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50',
                shake && 'border-destructive',
              )}
            >
              {pin.length > index ? '•' : ''}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PAD.map((key, index) =>
            key === '' ? (
              <div key={`empty-${index}`} />
            ) : (
              <Button
                key={key}
                type="button"
                variant="secondary"
                className="h-14 text-xl font-semibold"
                onClick={() => onDigit(key === 'del' ? 'del' : key)}
              >
                {key === 'del' ? <Delete className="h-5 w-5" /> : key}
              </Button>
            ),
          )}
        </div>

        <Button type="button" variant="ghost" onClick={closePinModal}>
          {t('cancel')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
