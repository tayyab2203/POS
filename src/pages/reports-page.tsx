import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2, MessageCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BackupReminderBanner } from '@/components/backup-reminder-banner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  computeDaySummary,
  db,
  openWhatsAppReport,
  saveDayClosing,
  type DaySummary,
} from '@/db'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useI18n } from '@/i18n'
import { formatMoney, todayKey } from '@/lib/format'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export function ReportsPage() {
  const { t } = useI18n()
  const whatsappEnabled = useFeatureFlag('enableWhatsAppReport')
  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const orderCount = useLiveQuery(() => db.orders.count(), [])
  const expenseCount = useLiveQuery(() => db.expenses.count(), [])
  const khataCount = useLiveQuery(() => db.khataTransactions.count(), [])

  const [date, setDate] = useState(todayKey())
  const [openingCash, setOpeningCash] = useState('0')
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState<DaySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setOpeningCash(String(settings.openingCashDefault || 0))
    }
  }, [settings])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    computeDaySummary(date, Number(openingCash) || 0)
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [date, openingCash, orderCount, expenseCount, khataCount])

  const expected =
    (Number(openingCash) || 0) +
    (summary?.cashSales ?? 0) +
    (summary?.khataCashReceived ?? 0) -
    (summary?.cashExpenses ?? 0)

  async function onSave() {
    if (!summary) return
    setSaving(true)
    try {
      await saveDayClosing({
        summary: {
          ...summary,
          openingCash: Number(openingCash) || 0,
          expectedCash: expected,
        },
        actualCash: actualCash === '' ? null : Number(actualCash),
        notes,
      })
      toast.success(t('closingSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  function onWhatsApp() {
    if (!summary || !settings) return
    openWhatsAppReport(
      {
        ...summary,
        openingCash: Number(openingCash) || 0,
        expectedCash: expected,
      },
      settings,
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <BackupReminderBanner lastBackupAt={settings?.lastBackupAt} />
      <Card>
        <CardHeader>
          <CardTitle>{t('dayClosing')}</CardTitle>
          <CardDescription>
            Expected cash = Opening + Cash sales + Khata wasooli − Cash expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('filterDate')}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('openingCash')}</Label>
              <Input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
          </div>

          {loading || !summary ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
              {t('loading')}
            </div>
          ) : (
            <div className="rounded-xl border bg-slate-50 px-4">
              <SummaryRow
                label={t('orders')}
                value={String(summary.orderCount)}
              />
              <SummaryRow
                label={t('total')}
                value={formatMoney(summary.totalSales)}
              />
              <SummaryRow
                label={t('cashSales')}
                value={formatMoney(summary.cashSales)}
              />
              <SummaryRow
                label={t('onlineSales')}
                value={formatMoney(summary.onlineSales)}
              />
              <SummaryRow
                label={t('udhaarSales')}
                value={formatMoney(summary.udhaarSales)}
              />
              <SummaryRow
                label={t('totalExpenses')}
                value={formatMoney(summary.totalExpenses)}
              />
              <SummaryRow
                label={t('khataReceived')}
                value={formatMoney(summary.khataCashReceived)}
              />
              <SummaryRow
                label={t('expectedCash')}
                value={formatMoney(expected)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('actualCash')}</Label>
            <Input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder={formatMoney(expected)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('note')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={saving || !summary} onClick={() => void onSave()}>
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('saveClosing')}
            </Button>
            {whatsappEnabled ? (
              <Button
                variant="outline"
                disabled={!summary}
                onClick={onWhatsApp}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                {t('sendWhatsApp')}
              </Button>
            ) : (
              <p className="self-center text-xs text-muted-foreground">
                {t('upgradeToPro')} — {t('sendWhatsApp')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
