import { Copy, Loader2, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/i18n'
import {
  validatePayment,
  validateUnlockDate,
} from '@/lib/admin-validation'
import { formatMoney } from '@/lib/format'
import { generateUnlockCode } from '@/lib/unlockCode'
import { cn } from '@/lib/utils'
import {
  daysUntilExpiry,
  extendShopDays,
  fetchShopPayments,
  logSubscriptionPayment,
  renewalWhatsAppUrl,
  setShopStatus,
  updateShopFeatureFlags,
  updateShopPlan,
} from '@/services/adminApi'
import { useAuthStore } from '@/stores/auth-store'
import type {
  FeatureFlags,
  PaymentMethodCloud,
  ShopPlan,
  ShopRow,
  SubscriptionPaymentRow,
} from '@/types/supabase'

interface ShopDetailSheetProps {
  shop: ShopRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (shop: ShopRow) => void
}

const FLAG_KEYS: (keyof FeatureFlags)[] = [
  'enableKhata',
  'enableWhatsAppReport',
  'enableAuditLog',
  'enableSplitPayment',
  'enableInventory',
]

export function ShopDetailSheet({
  shop,
  open,
  onOpenChange,
  onUpdated,
}: ShopDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {shop ? (
        <ShopDetailBody shop={shop} onUpdated={onUpdated} />
      ) : null}
    </Sheet>
  )
}

function ShopDetailBody({
  shop,
  onUpdated,
}: {
  shop: ShopRow
  onUpdated: (shop: ShopRow) => void
}) {
  const { t, language, dir } = useI18n()
  const session = useAuthStore((s) => s.session)
  const [busy, setBusy] = useState(false)
  const [payments, setPayments] = useState<SubscriptionPaymentRow[]>([])
  const [amount, setAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethodCloud>('cash')
  const [daysAdded, setDaysAdded] = useState('30')
  const [note, setNote] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [unlockCode, setUnlockCode] = useState('')
  const [payErrors, setPayErrors] = useState<Record<string, string>>({})
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<
    | null
    | {
        title: string
        description: string
        destructive?: boolean
        run: () => Promise<ShopRow>
        okMsg: string
      }
  >(null)

  useEffect(() => {
    setUnlockCode('')
    setAmount('')
    setDaysAdded('30')
    setNote('')
    setPayMethod('cash')
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 30)
    setUnlockDate(d.toISOString().slice(0, 10))
    void fetchShopPayments(shop.id)
      .then(setPayments)
      .catch(() => setPayments([]))
  }, [shop.id])

  const daysLeft = daysUntilExpiry(shop.expires_at)
  const flags = shop.feature_flags

  function askConfirm(
    title: string,
    description: string,
    action: () => Promise<ShopRow>,
    okMsg: string,
    destructive = false,
  ) {
    setConfirm({ title, description, destructive, run: action, okMsg })
  }

  async function onLogPayment() {
    const nextErrors = validatePayment({ amount, daysAdded })
    setPayErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      toast.error(t('validationFixForm'))
      return
    }
    const amt = Number(amount)
    const days = Number(daysAdded)
    askConfirm(
      t('confirmPaymentTitle'),
      t('confirmPaymentBody')
        .replace('{amount}', formatMoney(amt))
        .replace('{days}', String(days))
        .replace('{shop}', shop.name),
      async () => {
        const { shop: next, payment } = await logSubscriptionPayment({
          shop,
          amount: amt,
          method: payMethod,
          daysAdded: days,
          note: note.trim(),
          recordedBy: session?.userId ?? null,
        })
        setPayments((prev) => [payment, ...prev])
        setAmount('')
        setNote('')
        setPayErrors({})
        return next
      },
      t('adminPaymentLogged'),
    )
  }

  async function onGenerateUnlock() {
    const next = validateUnlockDate(unlockDate)
    if (next.unlockDate) {
      setUnlockError(
        next.unlockDate === 'datePast'
          ? t('validationDatePast')
          : t('requiredField'),
      )
      toast.error(t('validationFixForm'))
      return
    }
    setUnlockError(null)
    setBusy(true)
    try {
      const code = await generateUnlockCode(
        shop.id,
        unlockDate,
        shop.offline_secret,
      )
      setUnlockCode(code)
      await navigator.clipboard.writeText(code)
      toast.success(t('unlockCodeCopied'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adminActionFailed'))
    } finally {
      setBusy(false)
    }
  }

  function toggleFlag(key: keyof FeatureFlags) {
    const nextFlags = { ...flags, [key]: !flags[key] }
    askConfirm(
      t('confirmFlagTitle'),
      t('confirmFlagBody').replace(
        '{flag}',
        t(flagLabelKey(key)),
      ),
      () => updateShopFeatureFlags(shop.id, nextFlags),
      t('adminFlagsSaved'),
    )
  }

  return (
    <>
    <SheetContent
      side="right"
      dir={dir}
      className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
    >
      <SheetHeader className="border-b px-5 py-4 text-start">
        <SheetTitle className="truncate">{shop.name}</SheetTitle>
        <SheetDescription>
          {shop.owner_name}
          {shop.owner_phone ? ` · ${shop.owner_phone}` : ''}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant={shop.plan === 'pro' ? 'default' : 'secondary'}>
            {shop.plan}
          </Badge>
          <Badge
            variant={
              shop.status === 'suspended'
                ? 'destructive'
                : shop.status === 'trial'
                  ? 'warning'
                  : 'success'
            }
          >
            {shop.status}
          </Badge>
          <Badge variant="outline">
            {daysLeft >= 0
              ? `${daysLeft}d left`
              : `${Math.abs(daysLeft)}d overdue`}
          </Badge>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-6 pb-8">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('adminQuickRenew')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [7, t('renewPlus7')],
                  [30, t('renewPlus30')],
                  [90, t('renewPlus90')],
                  [365, t('renewPlusYear')],
                ] as const
              ).map(([days, label]) => (
                <Button
                  key={days}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    askConfirm(
                      t('confirmRenewTitle'),
                      t('confirmRenewBody')
                        .replace('{days}', String(days))
                        .replace('{shop}', shop.name),
                      () => extendShopDays(shop, days, 'active'),
                      t('adminRenewed'),
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {shop.status === 'suspended' ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    askConfirm(
                      t('confirmReactivateTitle'),
                      t('confirmReactivateBody').replace('{shop}', shop.name),
                      () => setShopStatus(shop.id, 'active'),
                      t('adminReactivated'),
                    )
                  }
                >
                  {t('reactivateShop')}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    askConfirm(
                      t('confirmSuspendTitle'),
                      t('confirmSuspendBody').replace('{shop}', shop.name),
                      () => setShopStatus(shop.id, 'suspended'),
                      t('adminSuspended'),
                      true,
                    )
                  }
                >
                  {t('suspendShop')}
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" asChild>
                <a
                  href={renewalWhatsAppUrl(shop, language)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('whatsappReminder')}
                </a>
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('adminPlan')}</h3>
            <Select
              value={shop.plan}
              onValueChange={(v) =>
                askConfirm(
                  t('confirmPlanTitle'),
                  t('confirmPlanBody')
                    .replace('{plan}', v)
                    .replace('{shop}', shop.name),
                  () => updateShopPlan(shop.id, v as ShopPlan, true),
                  t('adminPlanUpdated'),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">{t('planBasic')}</SelectItem>
                <SelectItem value="pro">{t('planPro')}</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('adminFeatureFlags')}</h3>
            <div className="space-y-1.5">
              {FLAG_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={busy}
                  onClick={() => toggleFlag(key)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm',
                    flags[key]
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <span>{t(flagLabelKey(key))}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {flags[key] ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('adminLogPayment')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('amount')} (PKR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(payErrors.amount && 'border-destructive')}
                />
                {payErrors.amount ? (
                  <p className="text-xs text-destructive">
                    {payErrors.amount === 'amountPositive'
                      ? t('validationAmountPositive')
                      : payErrors.amount === 'amountMax'
                        ? t('validationAmountMax')
                        : t('requiredField')}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label>{t('daysAdded')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={daysAdded}
                  onChange={(e) => setDaysAdded(e.target.value)}
                  className={cn(payErrors.daysAdded && 'border-destructive')}
                />
                {payErrors.daysAdded ? (
                  <p className="text-xs text-destructive">
                    {payErrors.daysAdded === 'daysRange'
                      ? t('validationDaysRange')
                      : t('requiredField')}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('paymentMethod')}</Label>
              <Select
                value={payMethod}
                onValueChange={(v) => setPayMethod(v as PaymentMethodCloud)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('cash')}</SelectItem>
                  <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="bank">{t('bankTransfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('note')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void onLogPayment()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('adminLogPayment')}
            </Button>
            {payments.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {payments.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b py-1.5 last:border-0"
                  >
                    <span>
                      {formatMoney(p.amount)} · {p.method} · +{p.days_added}d
                    </span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t('adminUnlockGenerator')}</h3>
            <p className="text-xs text-muted-foreground">{t('adminUnlockHint')}</p>
            <div className="space-y-1">
              <Label>{t('expiryDate')}</Label>
              <Input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className={cn(unlockError && 'border-destructive')}
              />
              {unlockError ? (
                <p className="text-xs text-destructive">{unlockError}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void onGenerateUnlock()}
            >
              {t('generateUnlockCode')}
            </Button>
            {unlockCode ? (
              <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 font-mono text-sm">
                <span className="min-w-0 flex-1 truncate">{unlockCode}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    void navigator.clipboard.writeText(unlockCode)
                    toast.success(t('copied'))
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </section>

          <section className="space-y-1 text-xs text-muted-foreground">
            <p>
              {t('expiryDate')}: {new Date(shop.expires_at).toLocaleString()}
            </p>
            <p>
              {t('lastSynced')}:{' '}
              {shop.last_sync_at
                ? new Date(shop.last_sync_at).toLocaleString()
                : '—'}
            </p>
          </section>
        </div>
      </ScrollArea>
    </SheetContent>

    <ConfirmDialog
      open={Boolean(confirm)}
      onOpenChange={(open) => {
        if (!open) setConfirm(null)
      }}
      title={confirm?.title ?? ''}
      description={confirm?.description ?? ''}
      destructive={confirm?.destructive}
      busy={busy}
      onConfirm={async () => {
        if (!confirm) return
        setBusy(true)
        try {
          const next = await confirm.run()
          onUpdated(next)
          toast.success(confirm.okMsg)
          setConfirm(null)
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : t('adminActionFailed'),
          )
        } finally {
          setBusy(false)
        }
      }}
    />
    </>
  )
}

function flagLabelKey(
  key: keyof FeatureFlags,
):
  | 'flagKhata'
  | 'flagWhatsApp'
  | 'flagAudit'
  | 'flagSplit'
  | 'flagInventory' {
  switch (key) {
    case 'enableKhata':
      return 'flagKhata'
    case 'enableWhatsAppReport':
      return 'flagWhatsApp'
    case 'enableAuditLog':
      return 'flagAudit'
    case 'enableSplitPayment':
      return 'flagSplit'
    case 'enableInventory':
      return 'flagInventory'
  }
}
