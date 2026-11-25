import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useLicenseStore } from '@/stores/license-store'

export function LicenseBanners() {
  const { t } = useI18n()
  const phase = useLicenseStore((s) => s.phase)
  const daysRemaining = useLicenseStore((s) => s.daysRemaining)
  const graceDaysLeft = useLicenseStore((s) => s.graceDaysLeft)
  const supportPhone = useLicenseStore((s) => s.supportPhone)
  const dismissed = useLicenseStore((s) => s.expiringBannerDismissed)
  const dismiss = useLicenseStore((s) => s.dismissExpiringBanner)

  if (phase === 'expiring_soon' && !dismissed) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="min-w-0 flex-1">
          {t('licenseExpiringSoon').replace(
            '{days}',
            String(daysRemaining ?? 0),
          )}
        </p>
        <button
          type="button"
          className="rounded p-1 hover:bg-amber-100"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (phase === 'grace') {
    const wa = supportPhone.replace(/\D/g, '')
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 border-b border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-950',
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="min-w-0 flex-1">
          {t('licenseGraceBanner').replace(
            '{days}',
            String(graceDaysLeft ?? 0),
          )}
        </p>
        {wa ? (
          <Button asChild size="sm" variant="outline" className="bg-white">
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(t('licenseRenewWhatsApp'))}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    )
  }

  return null
}
