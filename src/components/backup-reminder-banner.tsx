import { Download, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { downloadBackupFile } from '@/db'
import { useI18n } from '@/i18n'
import { isBackupOverdue } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface BackupReminderBannerProps {
  lastBackupAt: string | null | undefined
  className?: string
}

export function BackupReminderBanner({
  lastBackupAt,
  className,
}: BackupReminderBannerProps) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !isBackupOverdue(lastBackupAt)) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950',
        className,
      )}
    >
      <p className="min-w-0 flex-1">{t('backupReminder')}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-amber-300 bg-white"
        onClick={() => {
          void downloadBackupFile()
            .then(() => toast.success(t('backupExported')))
            .catch((err: unknown) =>
              toast.error(err instanceof Error ? err.message : 'Export failed'),
            )
        }}
      >
        <Download className="h-3.5 w-3.5" />
        {t('exportBackup')}
      </Button>
      <button
        type="button"
        className="rounded p-1 text-amber-800 hover:bg-amber-100"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
