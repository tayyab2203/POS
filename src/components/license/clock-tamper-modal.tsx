import { Loader2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import { useLicenseStore } from '@/stores/license-store'

export function ClockTamperModal() {
  const { t, dir } = useI18n()
  const clockTampered = useLicenseStore((s) => s.clockTampered)
  const verifyOnlineNow = useLicenseStore((s) => s.verifyOnlineNow)
  const [busy, setBusy] = useState(false)

  if (!clockTampered) return null

  return (
    <Dialog open>
      <DialogContent
        dir={dir}
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            {t('clockTamperTitle')}
          </DialogTitle>
          <DialogDescription>{t('clockTamperBody')}</DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void verifyOnlineNow()
              .then((ok) => {
                if (ok) toast.success(t('clockVerified'))
                else toast.error(t('clockVerifyFailed'))
              })
              .finally(() => setBusy(false))
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('verifyOnlineNow')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
