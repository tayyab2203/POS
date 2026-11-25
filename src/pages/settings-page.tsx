import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BackupReminderBanner } from '@/components/backup-reminder-banner'
import { AuditLogPanel } from '@/components/settings/audit-log-panel'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { ReceiptPreview } from '@/components/settings/receipt-preview'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  db,
  downloadBackupFile,
  resetTokenCounter,
  restoreBackupFromFile,
  updateSettings,
  type BusinessType,
  type PrinterWidth,
  type ReceiptConfig,
  type Settings,
} from '@/db'
import { useI18n } from '@/i18n'
import { compressImageToBase64 } from '@/lib/image'
import { printOrderSlips } from '@/lib/print'
import { buildSampleOrder } from '@/lib/sample-receipt-order'
import { cn } from '@/lib/utils'

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-slate-900"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

export function SettingsPage() {
  const { t, setLanguage, language } = useI18n()
  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const auditEnabled = useFeatureFlag('enableAuditLog')

  const [draft, setDraft] = useState<Settings | null>(null)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (settings) setDraft(settings)
  }, [settings])

  if (!draft) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="me-2 h-5 w-5 animate-spin" />
        {t('loading')}
      </div>
    )
  }

  const current: Settings = draft

  function patchDraft(patch: Partial<Settings>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function patchReceipt(patch: Partial<ReceiptConfig>) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            receiptConfig: { ...prev.receiptConfig, ...patch },
          }
        : prev,
    )
  }

  async function onLogo(file: File | null) {
    if (!file) return
    try {
      const data = await compressImageToBase64(file, 250, 0.7)
      patchDraft({ logoBase64: data })
    } catch {
      toast.error('Logo upload failed')
    }
  }

  async function save() {
    setSaving(true)
    try {
      let nextPin = current.ownerPin
      if (pin) {
        if (!/^\d{4}$/.test(pin)) {
          toast.error(t('newPin'))
          setSaving(false)
          return
        }
        if (pin !== pinConfirm) {
          toast.error(t('confirmPin'))
          setSaving(false)
          return
        }
        nextPin = pin
      }

      await updateSettings({
        shopName: current.shopName.trim(),
        address: current.address.trim(),
        phone: current.phone.trim(),
        ownerWhatsApp: current.ownerWhatsApp.trim(),
        businessType: current.businessType,
        printerWidth: current.printerWidth,
        receiptConfig: current.receiptConfig,
        logoBase64: current.logoBase64,
        language: current.language,
        ownerPin: nextPin,
        minStockAlert: Math.max(0, current.minStockAlert ?? 5),
      })

      if (current.language !== language) {
        setLanguage(current.language)
      }

      if (pin) {
        toast.success(t('pinUpdated'))
        setPin('')
        setPinConfirm('')
      } else {
        toast.success(t('settingsSaved'))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function testPrint() {
    setPrinting(true)
    try {
      toast.message(t('printing'))
      await printOrderSlips({
        order: buildSampleOrder(current),
        settings: current,
        includeReceipt: true,
        includeKot:
          current.businessType === 'food' &&
          current.receiptConfig.autoPrintKot,
      })
    } finally {
      setPrinting(false)
    }
  }

  const businessOptions: { id: BusinessType; label: string }[] = [
    { id: 'food', label: t('businessFood') },
    { id: 'retail', label: t('businessRetail') },
    { id: 'bakery', label: t('businessBakery') },
  ]

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 lg:col-span-2">
        <BackupReminderBanner lastBackupAt={current.lastBackupAt} />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('shopProfile')}</CardTitle>
            <CardDescription>{t('shopDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('businessType')}</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {businessOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      'rounded-xl border-2 px-3 py-3 text-sm font-semibold',
                      current.businessType === opt.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200',
                    )}
                    onClick={() => patchDraft({ businessType: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('shopName')}</Label>
              <Input
                value={current.shopName}
                onChange={(e) => patchDraft({ shopName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('shopAddress')}</Label>
              <Input
                value={current.address}
                onChange={(e) => patchDraft({ address: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('shopPhone')}</Label>
                <Input
                  value={current.phone}
                  onChange={(e) => patchDraft({ phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('ownerWhatsApp')}</Label>
                <Input
                  value={current.ownerWhatsApp}
                  onChange={(e) =>
                    patchDraft({ ownerWhatsApp: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('uploadLogo')}</Label>
              <div className="flex flex-wrap items-center gap-3">
                {current.logoBase64 ? (
                  <img
                    src={current.logoBase64}
                    alt=""
                    className="h-16 w-16 rounded-lg border object-contain"
                  />
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onLogo(e.target.files?.[0] ?? null)}
                />
                {current.logoBase64 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => patchDraft({ logoBase64: null })}
                  >
                    {t('removeLogo')}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('receiptSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('printerWidth')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {([58, 80] as PrinterWidth[]).map((width) => (
                  <button
                    key={width}
                    type="button"
                    className={cn(
                      'rounded-xl border-2 py-3 text-sm font-semibold',
                      current.printerWidth === width
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200',
                    )}
                    onClick={() => patchDraft({ printerWidth: width })}
                  >
                    {width === 58 ? t('mm58') : t('mm80')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label={t('showLogo')}
                checked={current.receiptConfig.showLogo}
                onChange={(v) => patchReceipt({ showLogo: v })}
              />
              <ToggleRow
                label={t('showToken')}
                checked={current.receiptConfig.showToken}
                onChange={(v) => patchReceipt({ showToken: v })}
              />
              <ToggleRow
                label={t('showOrderType')}
                checked={current.receiptConfig.showOrderType}
                onChange={(v) => patchReceipt({ showOrderType: v })}
              />
              <ToggleRow
                label={t('showTax')}
                checked={current.receiptConfig.showTax}
                onChange={(v) => patchReceipt({ showTax: v })}
              />
              <ToggleRow
                label={t('showSku')}
                checked={current.receiptConfig.showSku}
                onChange={(v) => patchReceipt({ showSku: v })}
              />
              <ToggleRow
                label={t('showUdhaarBalance')}
                checked={current.receiptConfig.showUdhaarBalance}
                onChange={(v) => patchReceipt({ showUdhaarBalance: v })}
              />
              <ToggleRow
                label={t('showItemDiscount')}
                checked={current.receiptConfig.showItemDiscount}
                onChange={(v) => patchReceipt({ showItemDiscount: v })}
              />
              <ToggleRow
                label={t('autoPrintKot')}
                checked={current.receiptConfig.autoPrintKot}
                onChange={(v) => patchReceipt({ autoPrintKot: v })}
              />
            </div>

            {current.receiptConfig.showTax ? (
              <div className="space-y-2">
                <Label>{t('taxPercent')}</Label>
                <Input
                  type="number"
                  value={current.receiptConfig.taxPercent}
                  onChange={(e) =>
                    patchReceipt({ taxPercent: Number(e.target.value) || 0 })
                  }
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>{t('footerMessage')}</Label>
              <Textarea
                value={current.receiptConfig.footerMessage}
                onChange={(e) =>
                  patchReceipt({ footerMessage: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('ownerPin')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('newPin')}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder="****"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('confirmPin')}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinConfirm}
                onChange={(e) =>
                  setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder="****"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {([
              { id: 'en' as const, label: t('english') },
              { id: 'ur' as const, label: t('urdu') },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  'rounded-xl border-2 py-3 font-semibold',
                  current.language === opt.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200',
                )}
                onClick={() => patchDraft({ language: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('stockAlerts')}</CardTitle>
            <CardDescription>{t('minStockAlertDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t('minStockAlert')}</Label>
              <Input
                type="number"
                value={current.minStockAlert ?? 5}
                onChange={(e) =>
                  patchDraft({
                    minStockAlert: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!window.confirm(t('resetTokenConfirm'))) return
                void resetTokenCounter()
                  .then(() => toast.success(t('tokenResetDone')))
                  .catch((err: unknown) =>
                    toast.error(
                      err instanceof Error ? err.message : 'Failed',
                    ),
                  )
              }}
            >
              {t('resetTokenCounter')}
            </Button>
          </CardContent>
        </Card>

        {auditEnabled ? <AuditLogPanel /> : null}

        <Card>
          <CardHeader>
            <CardTitle>{t('backupSection')}</CardTitle>
            <CardDescription>{t('backupWarning')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void downloadBackupFile()
                  .then(() => toast.success(t('backupExported')))
                  .catch((err: unknown) =>
                    toast.error(
                      err instanceof Error ? err.message : 'Export failed',
                    ),
                  )
              }}
            >
              {t('exportBackup')}
            </Button>
            <Label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
              {t('restoreBackup')}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  if (!window.confirm(t('backupWarning'))) return
                  void restoreBackupFromFile(file)
                    .then(() => toast.success(t('backupRestored')))
                    .catch((err: unknown) =>
                      toast.error(
                        err instanceof Error ? err.message : 'Restore failed',
                      ),
                    )
                }}
              />
            </Label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {t('save')}
          </Button>
          <Button
            variant="outline"
            disabled={printing}
            onClick={() => void testPrint()}
          >
            {printing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {t('testPrint')}
          </Button>
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div>
          <h3 className="text-sm font-semibold">{t('receiptPreview')}</h3>
          <p className="text-xs text-muted-foreground">
            {current.printerWidth}mm · {current.businessType}
          </p>
        </div>
        <Separator />
        <div className="rounded-2xl bg-slate-200/60 p-4">
          <ReceiptPreview settings={current} showKotPreview />
        </div>
        {current.businessType === 'food' &&
        current.receiptConfig.autoPrintKot ? (
          <p className="text-center text-xs text-muted-foreground">
            {t('kotPreview')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
