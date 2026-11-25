import { useLiveQuery } from 'dexie-react-hooks'
import { Minus, PauseCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { HeldOrdersSheet } from '@/components/pos/held-orders-sheet'
import { KitchenNotesDialog } from '@/components/pos/kitchen-notes-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  checkoutOrder,
  getSettings,
  holdOrder,
  listCustomers,
  listHeldOrders,
  resumeHeldOrder,
  type BusinessType,
  type OrderType,
  type PaymentMethod,
} from '@/db'
import { POS_EVENTS } from '@/hooks/use-pos-shortcuts'
import { useI18n } from '@/i18n'
import { formatMoney, formatQty } from '@/lib/format'
import { printOrderSlips } from '@/lib/print'
import { cn } from '@/lib/utils'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useCartStore } from '@/stores'
import { useLicenseStore } from '@/stores/license-store'

interface CartPanelProps {
  businessType: BusinessType
  compact?: boolean
  onCheckedOut?: () => void
  /** Only one mounted cart should listen to F8/F9 (avoid double checkout). */
  listenShortcuts?: boolean
}

const QUICK_CASH = [500, 1000, 5000] as const

export function CartPanel({
  businessType,
  compact = false,
  onCheckedOut,
  listenShortcuts = false,
}: CartPanelProps) {
  const { t } = useI18n()
  const items = useCartStore((s) => s.items)
  const orderType = useCartStore((s) => s.orderType)
  const discount = useCartStore((s) => s.discount)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const splitPayment = useCartStore((s) => s.splitPayment)
  const paymentBreakdown = useCartStore((s) => s.paymentBreakdown)
  const cashReceived = useCartStore((s) => s.cashReceived)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const setLineNotes = useCartStore((s) => s.setLineNotes)
  const setOrderType = useCartStore((s) => s.setOrderType)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const setSplitPayment = useCartStore((s) => s.setSplitPayment)
  const setPaymentBreakdown = useCartStore((s) => s.setPaymentBreakdown)
  const setCashReceived = useCartStore((s) => s.setCashReceived)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const customerId = useCartStore((s) => s.customerId)
  const clearCart = useCartStore((s) => s.clearCart)
  const loadFromHeld = useCartStore((s) => s.loadFromHeld)
  const subtotal = useCartStore((s) => s.subtotal)
  const total = useCartStore((s) => s.total)
  const changeDue = useCartStore((s) => s.changeDue)
  const itemCount = useCartStore((s) => s.itemCount)

  const [busy, setBusy] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [notesLineId, setNotesLineId] = useState<string | null>(null)
  const canCheckout = useLicenseStore((s) => s.canCheckout)
  const tickClock = useLicenseStore((s) => s.tickClock)
  const splitEnabled = useFeatureFlag('enableSplitPayment')
  const khataEnabled = useFeatureFlag('enableKhata')
  const held = useLiveQuery(() => listHeldOrders(), [])
  const customers = useLiveQuery(() => listCustomers(), [])

  const showOrderTypes = businessType === 'food'
  const assignToken = businessType === 'food' || businessType === 'bakery'
  const heldCount = held?.length ?? 0

  async function onHold() {
    if (items.length === 0) return
    setBusy(true)
    try {
      const preview = items
        .slice(0, 2)
        .map((line) => `${formatQty(line.quantity)}× ${line.name}`)
        .join(', ')
      const extra = items.length > 2 ? ` +${items.length - 2}` : ''
      await holdOrder({
        items,
        orderType,
        discount,
        paymentMethod,
        customerId: null,
        customerName: null,
        label: `${preview}${extra}`,
      })
      clearCart()
      toast.success(t('orderHeld'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function onResume(id: string) {
    setBusy(true)
    try {
      const order = await resumeHeldOrder(id)
      loadFromHeld({
        items: order.items.map((item) => ({
          ...item,
          lineId: crypto.randomUUID(),
        })),
        orderType: order.orderType,
        discount: order.discount,
        paymentMethod: order.paymentMethod,
        customerId: order.customerId,
        customerName: order.customerName,
        heldLabel: order.note,
      })
      toast.success(t('cartRestored'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function onCheckout() {
    if (items.length === 0) return
    if (!canCheckout) {
      toast.error(t('billingLocked'))
      return
    }
    if (showOrderTypes && !orderType) {
      toast.error(t('orderType'))
      return
    }
    if (
      !khataEnabled &&
      (paymentMethod === 'udhaar' ||
        (splitPayment && (paymentBreakdown.udhaar || 0) > 0))
    ) {
      toast.error(t('featureLocked'))
      return
    }
    const needsCustomer =
      (!splitPayment && paymentMethod === 'udhaar') ||
      (splitPayment && (paymentBreakdown.udhaar || 0) > 0)
    if (needsCustomer && !customerId) {
      toast.error(t('selectCustomer'))
      return
    }
    if (splitPayment) {
      const sum =
        (paymentBreakdown.cash || 0) +
        (paymentBreakdown.online || 0) +
        (paymentBreakdown.udhaar || 0)
      if (Math.abs(sum - total()) > 0.02) {
        toast.error(t('splitMustMatch'))
        return
      }
    }
    const customer = (customers ?? []).find((c) => c.id === customerId) ?? null
    setBusy(true)
    try {
      const order = await checkoutOrder({
        items,
        orderType,
        discount,
        paymentMethod: splitPayment ? 'split' : paymentMethod,
        splitPayment: splitEnabled && splitPayment,
        paymentBreakdown:
          splitEnabled && splitPayment ? paymentBreakdown : null,
        cashReceived,
        customerId,
        customerName: customer?.name ?? null,
        assignToken,
      })
      await tickClock()
      const settings = await getSettings()
      clearCart()
      toast.success(
        `${t('orderSaved')}${order.tokenNumber ? ` · #${order.tokenNumber}` : ''} · ${order.invoiceNumber}`,
      )
      onCheckedOut?.()
      toast.message(t('printing'))
      await printOrderSlips({
        order,
        settings,
        includeReceipt: true,
        includeKot:
          settings.businessType === 'food' &&
          settings.receiptConfig.autoPrintKot,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  function setPay(method: PaymentMethod) {
    setPaymentMethod(method)
    if (method === 'cash') {
      setCashReceived(cashReceived ?? total())
    } else {
      setCashReceived(null)
    }
    if (method !== 'udhaar') {
      setCustomer(null, null)
    }
  }

  useEffect(() => {
    if (khataEnabled) return
    if (paymentMethod === 'udhaar') setPay('cash')
    if ((paymentBreakdown.udhaar || 0) > 0) {
      setPaymentBreakdown({ udhaar: 0 })
    }
  }, [khataEnabled, paymentMethod, paymentBreakdown.udhaar])

  const orderTypes: { id: OrderType; label: string }[] = [
    { id: 'dine_in', label: t('dineIn') },
    { id: 'takeaway', label: t('takeaway') },
    { id: 'delivery', label: t('delivery') },
  ]

  const holdRef = useRef(onHold)
  const checkoutRef = useRef(onCheckout)
  holdRef.current = onHold
  checkoutRef.current = onCheckout

  useEffect(() => {
    if (!listenShortcuts) return
    const handleCheckout = () => {
      void checkoutRef.current()
    }
    const handleHold = () => {
      void holdRef.current()
    }
    const handleClose = () => setHeldOpen(false)
    window.addEventListener(POS_EVENTS.checkout, handleCheckout)
    window.addEventListener(POS_EVENTS.hold, handleHold)
    window.addEventListener(POS_EVENTS.closeOverlays, handleClose)
    return () => {
      window.removeEventListener(POS_EVENTS.checkout, handleCheckout)
      window.removeEventListener(POS_EVENTS.hold, handleHold)
      window.removeEventListener(POS_EVENTS.closeOverlays, handleClose)
    }
  }, [listenShortcuts])

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-semibold tracking-tight">{t('cart')}</h3>
          <p className="text-xs text-muted-foreground">
            {itemCount()} {t('items')} · {formatMoney(total())}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {heldCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              onClick={() => setHeldOpen(true)}
            >
              <PauseCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('viewHeld')}</span>
              <Badge className="bg-amber-600 text-white hover:bg-amber-600">
                {heldCount}
              </Badge>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={items.length === 0}
            onClick={clearCart}
          >
            {t('clearCart')}
          </Button>
        </div>
      </div>

      {showOrderTypes ? (
        <div className="grid grid-cols-3 gap-2 border-b p-3">
          {orderTypes.map((ot) => (
            <button
              key={ot.id}
              type="button"
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                orderType === ot.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400',
              )}
              onClick={() => setOrderType(ot.id)}
            >
              {ot.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Active cart stays primary — held orders live in a sheet */}
      <ScrollArea className={cn('min-h-0 flex-1', compact ? 'max-h-[42vh]' : '')}>
        <div className="space-y-2 p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 px-4 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                {t('emptyCart')}
              </p>
              {heldCount > 0 ? (
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 text-amber-700"
                  onClick={() => setHeldOpen(true)}
                >
                  {heldCount} {t('heldCount')} — {t('viewHeld')}
                </Button>
              ) : null}
            </div>
          ) : (
            items.map((line) => (
              <div
                key={line.lineId}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-start"
                    onClick={() => {
                      if (businessType === 'food') setNotesLineId(line.lineId)
                    }}
                  >
                    <p className="truncate font-semibold text-slate-900">
                      {line.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(line.unitPrice)} ·{' '}
                      {formatQty(line.quantity, line.unit)}
                      {businessType === 'food' ? ` · ${t('tapForNotes')}` : ''}
                    </p>
                    {line.notes ? (
                      <p className="mt-1 text-xs font-bold text-amber-800">
                        {line.notes}
                      </p>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-destructive"
                    onClick={() => removeItem(line.lineId)}
                    aria-label={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        updateQty(
                          line.lineId,
                          line.quantity -
                            (line.unit === 'kg' || line.unit === 'g'
                              ? 0.25
                              : 1),
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="min-w-10 text-center text-sm font-bold tabular-nums">
                      {formatQty(line.quantity)}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        updateQty(
                          line.lineId,
                          line.quantity +
                            (line.unit === 'kg' || line.unit === 'g'
                              ? 0.25
                              : 1),
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-base font-bold tabular-nums">
                    {formatMoney(line.lineTotal)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="space-y-3 border-t bg-slate-50/80 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('subtotal')}</span>
          <span className="font-medium tabular-nums">
            {formatMoney(subtotal())}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">
            {t('discount')}
          </span>
          <Input
            type="number"
            className="h-9 bg-white"
            value={discount || ''}
            placeholder="0"
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 text-white">
          <span className="text-sm font-medium">{t('total')}</span>
          <span className="text-lg font-bold tabular-nums">
            {formatMoney(total())}
          </span>
        </div>

        {splitEnabled ? (
          <button
            type="button"
            className={cn(
              'w-full rounded-lg border px-2 py-2 text-xs font-semibold',
              splitPayment
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white',
            )}
            onClick={() => {
              const next = !splitPayment
              setSplitPayment(next)
              if (next) {
                setPaymentBreakdown({
                  cash: total(),
                  online: 0,
                  udhaar: 0,
                })
                setCashReceived(total())
              }
            }}
          >
            {t('splitPayment')}
          </button>
        ) : (
          <p className="rounded-lg border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
            {t('upgradeToPro')} — {t('splitPayment')}
          </p>
        )}

        {!splitPayment ? (
          <div
            className={cn(
              'grid gap-2',
              khataEnabled ? 'grid-cols-3' : 'grid-cols-2',
            )}
          >
            {(
              [
                ['cash', t('cash')],
                ['online', t('onlinePay')],
                ...(khataEnabled
                  ? ([['udhaar', t('udhaar')]] as const)
                  : ([] as const)),
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cn(
                  'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                  paymentMethod === id
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-slate-200 bg-white hover:border-slate-400',
                )}
                onClick={() => setPay(id)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border bg-white p-2">
            {(
              [
                ['cash', t('cash')],
                ['online', t('onlinePay')],
                ...(khataEnabled
                  ? ([['udhaar', t('udhaar')]] as const)
                  : ([] as const)),
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium">{label}</span>
                <Input
                  type="number"
                  className="h-8"
                  value={paymentBreakdown[key] || ''}
                  onChange={(e) =>
                    setPaymentBreakdown({
                      [key]: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            ))}
            <p
              className={cn(
                'text-xs font-medium',
                Math.abs(
                  (paymentBreakdown.cash || 0) +
                    (paymentBreakdown.online || 0) +
                    (paymentBreakdown.udhaar || 0) -
                    total(),
                ) < 0.02
                  ? 'text-emerald-700'
                  : 'text-destructive',
              )}
            >
              {t('splitTotal')}:{' '}
              {formatMoney(
                (paymentBreakdown.cash || 0) +
                  (paymentBreakdown.online || 0) +
                  (paymentBreakdown.udhaar || 0),
              )}{' '}
              / {formatMoney(total())}
            </p>
          </div>
        )}

        {!splitPayment && paymentMethod === 'cash' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setCashReceived(total())}
              >
                {t('exact')}
              </Button>
              {QUICK_CASH.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={() => setCashReceived(amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('cashReceived')}</span>
              <Input
                type="number"
                className="h-9 w-28 bg-white"
                value={cashReceived ?? ''}
                onChange={(e) =>
                  setCashReceived(
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
              <span>{t('changeDue')}</span>
              <span className="tabular-nums">{formatMoney(changeDue())}</span>
            </div>
          </div>
        ) : null}

        {splitPayment && (paymentBreakdown.cash || 0) > 0 ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('cashReceived')}</span>
            <Input
              type="number"
              className="h-9 w-28 bg-white"
              value={cashReceived ?? ''}
              onChange={(e) =>
                setCashReceived(
                  e.target.value === '' ? null : Number(e.target.value),
                )
              }
            />
          </div>
        ) : null}

        {(!splitPayment && paymentMethod === 'udhaar') ||
        (splitPayment && (paymentBreakdown.udhaar || 0) > 0) ? (
          <div className="space-y-2">
            <Select
              value={customerId ?? undefined}
              onValueChange={(id) => {
                const customer = (customers ?? []).find((c) => c.id === id)
                setCustomer(id, customer?.name ?? null)
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={t('selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} · {formatMoney(customer.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(customers ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noCustomers')}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="bg-white"
            disabled={busy || items.length === 0}
            onClick={() => void onHold()}
          >
            {t('holdOrder')}
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            disabled={busy || items.length === 0 || !canCheckout}
            onClick={() => void onCheckout()}
          >
            {t('payPrint')}
          </Button>
        </div>
      </div>

      <HeldOrdersSheet
        open={heldOpen}
        onOpenChange={setHeldOpen}
        orders={held ?? []}
        busy={busy}
        cartHasItems={items.length > 0}
        onResume={onResume}
      />

      <KitchenNotesDialog
        open={!!notesLineId}
        itemName={
          items.find((l) => l.lineId === notesLineId)?.name ?? ''
        }
        initialNotes={
          items.find((l) => l.lineId === notesLineId)?.notes ?? ''
        }
        onOpenChange={(open) => {
          if (!open) setNotesLineId(null)
        }}
        onSave={(notes) => {
          if (notesLineId) setLineNotes(notesLineId, notes)
        }}
      />
    </div>
  )
}
