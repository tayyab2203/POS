import { PauseCircle, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { deleteHeldOrder, type Order, type OrderType } from '@/db'
import { useI18n } from '@/i18n'
import { formatMoney, formatQty } from '@/lib/format'
import { orderTypeLabel } from '@/lib/receipt-labels'

interface HeldOrdersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: Order[]
  busy: boolean
  cartHasItems: boolean
  onResume: (orderId: string) => Promise<void>
}

function orderTypeBadge(type: OrderType | null): string {
  if (!type) return ''
  return orderTypeLabel(type)
}

export function HeldOrdersSheet({
  open,
  onOpenChange,
  orders,
  busy,
  cartHasItems,
  onResume,
}: HeldOrdersSheetProps) {
  const { t, dir } = useI18n()

  async function handleResume(orderId: string) {
    if (cartHasItems && !window.confirm(t('cartHasItems'))) return
    await onResume(orderId)
    onOpenChange(false)
  }

  async function handleDiscard(orderId: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    try {
      await deleteHeldOrder(orderId)
      toast.success(t('deleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        dir={dir}
      >
        <SheetHeader className="border-b px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-amber-600" />
            {t('heldOrders')}
            <Badge variant="secondary">{orders.length}</Badge>
          </SheetTitle>
          <SheetDescription>
            Tap an order to see full items, then resume into the cart.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-3 p-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-slate-50 px-4 py-12 text-center text-sm text-muted-foreground">
                {t('noHeldOrders')}
              </div>
            ) : (
              orders.map((order, index) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 border-b bg-slate-50 px-4 py-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                          #{index + 1}
                        </span>
                        {order.orderType ? (
                          <Badge variant="outline">
                            {orderTypeBadge(order.orderType)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                        {' · '}
                        {order.items.length} {t('items')}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-base font-bold tabular-nums">
                        {formatMoney(order.total)}
                      </p>
                    </div>
                  </div>

                  <ul className="divide-y px-4">
                    {order.items.map((item, itemIndex) => (
                      <li
                        key={`${order.id}-${item.productId}-${itemIndex}`}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(item.unitPrice)} ×{' '}
                            {formatQty(item.quantity, item.unit)}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatMoney(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 border-t bg-white p-3">
                    <Button
                      className="flex-1 bg-slate-900 hover:bg-slate-800"
                      disabled={busy}
                      onClick={() => void handleResume(order.id)}
                    >
                      <Play className="h-4 w-4" />
                      {cartHasItems ? t('replaceAndResume') : t('resumeOrder')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => void handleDiscard(order.id)}
                      aria-label={t('discardHeld')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
