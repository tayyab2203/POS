import { useLiveQuery } from 'dexie-react-hooks'
import { Ban, Printer, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BackupReminderBanner } from '@/components/backup-reminder-banner'
import { DateRangeToolbar } from '@/components/date-range-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { db, getSettings, listOrders, voidOrder, type Order } from '@/db'
import { useI18n } from '@/i18n'
import { type DatePreset, PAGE_SIZE, presetToRange } from '@/lib/date-range'
import { formatMoney } from '@/lib/format'
import { reprintKot, reprintReceipt } from '@/lib/print'
import { paymentLabel } from '@/lib/receipt-labels'
import { useSessionStore } from '@/stores'

export function OrdersPage() {
  const { t } = useI18n()
  const role = useSessionStore((s) => s.role)
  const openPinModal = useSessionStore((s) => s.openPinModal)
  const settings = useLiveQuery(() => db.settings.get('shop'), [])

  const initial = presetToRange('today')
  const [preset, setPreset] = useState<DatePreset>('today')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const orders = useLiveQuery(
    () => listOrders({ from, to, limit }),
    [from, to, limit],
  )

  const grouped = orders ?? []
  const canLoadMore = grouped.length >= limit

  const rangeLabel = useMemo(() => `${from} → ${to}`, [from, to])

  async function onReprint(order: Order, kot = false) {
    const s = await getSettings()
    if (kot) await reprintKot(order, s)
    else await reprintReceipt(order, s)
  }

  async function onVoid(order: Order) {
    if (role !== 'owner') {
      openPinModal(null)
      toast.error(t('enterOwnerPin'))
      return
    }
    if (!window.confirm(`${t('voidBill')}?`)) return
    try {
      await voidOrder(order.id)
      toast.success(t('voidSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <BackupReminderBanner lastBackupAt={settings?.lastBackupAt} />

      <DateRangeToolbar
        preset={preset}
        from={from}
        to={to}
        onPresetChange={(p) => {
          setPreset(p)
          setLimit(PAGE_SIZE)
        }}
        onFromChange={(v) => {
          setFrom(v)
          setLimit(PAGE_SIZE)
        }}
        onToChange={(v) => {
          setTo(v)
          setLimit(PAGE_SIZE)
        }}
        count={grouped.length}
      />
      <p className="text-xs text-muted-foreground">{rangeLabel}</p>

      {grouped.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
          {t('noOrders')}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{order.invoiceNumber}</h3>
                    {order.tokenNumber !== null ? (
                      <Badge>#{order.tokenNumber}</Badge>
                    ) : null}
                    <Badge
                      variant={
                        order.status === 'voided' ? 'destructive' : 'success'
                      }
                    >
                      {order.status === 'voided' ? t('voided') : t('completed')}
                    </Badge>
                    <Badge variant="outline">
                      {paymentLabel(order.paymentMethod)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                    {order.customerName ? ` · ${order.customerName}` : ''}
                    {` · ${order.items.length} ${t('items')}`}
                  </p>
                </div>
                <div className="text-lg font-bold">
                  {formatMoney(order.total)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={order.status === 'voided'}
                  onClick={() => void onReprint(order, false)}
                >
                  <Printer className="h-4 w-4" />
                  {t('reprint')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={order.status === 'voided'}
                  onClick={() => void onReprint(order, true)}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  {t('reprintKot')}
                </Button>
                {order.status !== 'voided' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void onVoid(order)}
                  >
                    <Ban className="h-4 w-4" />
                    {t('voidBill')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {canLoadMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
            >
              {t('loadMore')}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
