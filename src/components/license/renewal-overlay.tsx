import { Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'
import { runSyncNow } from '@/services/syncEngine'
import { useAuthStore } from '@/stores/auth-store'
import { useLicenseStore } from '@/stores/license-store'

export function RenewalOverlay() {
  const { t, dir } = useI18n()
  const phase = useLicenseStore((s) => s.phase)
  const clockTampered = useLicenseStore((s) => s.clockTampered)
  const shopName = useLicenseStore((s) => s.shopName)
  const expiresAt = useLicenseStore((s) => s.expiresAt)
  const supportPhone = useLicenseStore((s) => s.supportPhone)
  const applyOfflineUnlock = useLicenseStore((s) => s.applyOfflineUnlock)
  const hydrateFromShop = useLicenseStore((s) => s.hydrateFromShop)
  const refreshShopLicense = useAuthStore((s) => s.refreshShopLicense)

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  // Soft lock only (not clock modal — that has its own UI)
  if (phase !== 'soft_locked' || clockTampered) return null

  const wa = supportPhone.replace(/\D/g, '')
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString()
    : '—'

  async function onPaidCheck() {
    setBusy(true)
    try {
      await runSyncNow()
      const shop = await refreshShopLicense()
      if (shop) await hydrateFromShop(shop)
      toast.success(t('licenseRefreshed'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('licenseRefreshFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function onUnlock() {
    setBusy(true)
    try {
      const result = await applyOfflineUnlock(code)
      if (result.ok) {
        toast.success(t('unlockSuccess'))
        setCode('')
      } else {
        toast.error(result.error ?? t('unlockFailed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      dir={dir}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-semibold">{t('renewalTitle')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('renewalBody')}</p>

        <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{t('shopName')}</dt>
            <dd className="font-medium">{shopName || '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{t('expiryDate')}</dt>
            <dd className="font-medium tabular-nums">{expiryLabel}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2">
          {wa ? (
            <Button asChild variant="outline">
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(t('licenseRenewWhatsApp'))}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp / {t('shopPhone')}
              </a>
            </Button>
          ) : null}

          <Button
            type="button"
            disabled={busy}
            onClick={() => void onPaidCheck()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('iPaidCheckOnline')}
          </Button>
        </div>

        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            {t('offlineUnlockHint')}
          </p>
          <Input
            value={code}
            placeholder="POS-YYYYMMDD-XXXXXX"
            data-no-barcode="true"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy || !code.trim()}
            onClick={() => void onUnlock()}
          >
            {t('enterUnlockCode')}
          </Button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {t('renewalHistorySafe')}
        </p>
      </div>
    </div>
  )
}
