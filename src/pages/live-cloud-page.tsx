import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useI18n } from '@/i18n'
import { todayKey } from '@/lib/format'
import { formatMoney } from '@/lib/format'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

interface CloudSummary {
  orderCount: number
  totalSales: number
  cashSales: number
  onlineSales: number
  udhaarSales: number
  totalExpenses: number
  expectedCash: number
  recentOrders: Array<{
    id: string
    invoice_number: string
    total: number
    payment_method: string
    created_at: string
    status: string
  }>
}

export function LiveCloudPage() {
  const { t } = useI18n()
  const session = useAuthStore((s) => s.session)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<CloudSummary | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.shopId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const client = getSupabase()
      const today = todayKey()
      const shopId = session.shopId

      const [ordersRes, expensesRes] = await Promise.all([
        client
          .from('orders')
          .select(
            'id, invoice_number, total, payment_method, payment_breakdown, created_at, status, local_date',
          )
          .eq('shop_id', shopId)
          .eq('local_date', today)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        client
          .from('expenses')
          .select('amount, payment_method, local_date')
          .eq('shop_id', shopId)
          .eq('local_date', today)
          .is('deleted_at', null),
      ])

      if (ordersRes.error) throw new Error(ordersRes.error.message)
      if (expensesRes.error) throw new Error(expensesRes.error.message)

      const orders = ordersRes.data ?? []
      const completed = orders.filter((o) => o.status === 'completed')
      let cashSales = 0
      let onlineSales = 0
      let udhaarSales = 0
      for (const o of completed) {
        const b = (o.payment_breakdown ?? {}) as {
          cash?: number
          online?: number
          udhaar?: number
        }
        if (b.cash || b.online || b.udhaar) {
          cashSales += Number(b.cash ?? 0)
          onlineSales += Number(b.online ?? 0)
          udhaarSales += Number(b.udhaar ?? 0)
        } else if (o.payment_method === 'cash') {
          cashSales += Number(o.total ?? 0)
        } else if (o.payment_method === 'online') {
          onlineSales += Number(o.total ?? 0)
        } else if (o.payment_method === 'udhaar') {
          udhaarSales += Number(o.total ?? 0)
        }
      }
      const totalSales = cashSales + onlineSales + udhaarSales
      const expenses = expensesRes.data ?? []
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount ?? 0),
        0,
      )
      const cashExpenses = expenses
        .filter((e) => e.payment_method === 'cash')
        .reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

      setSummary({
        orderCount: completed.length,
        totalSales,
        cashSales,
        onlineSales,
        udhaarSales,
        totalExpenses,
        expectedCash: cashSales - cashExpenses,
        recentOrders: orders.slice(0, 15).map((o) => ({
          id: o.id,
          invoice_number: o.invoice_number,
          total: Number(o.total ?? 0),
          payment_method: o.payment_method,
          created_at: o.created_at,
          status: o.status,
        })),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('liveCloudError'))
    } finally {
      setLoading(false)
    }
  }, [session?.shopId, t])

  useEffect(() => {
    void load()
  }, [load])

  if (!session?.shopId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t('liveCloudNoShop')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('liveCloud')}</h2>
          <p className="text-sm text-muted-foreground">{t('liveCloudDesc')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t('refresh')}
        </Button>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('today')}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatMoney(summary.totalSales)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {summary.orderCount} {t('orders')}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('expectedCash')}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatMoney(summary.expectedCash)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t('totalExpenses')}: {formatMoney(summary.totalExpenses)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('paymentBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('cash')}</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(summary.cashSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('onlinePay')}</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(summary.onlineSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('udhaar')}</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(summary.udhaarSales)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('recentOrders')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
              ) : (
                summary.recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{o.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-semibold tabular-nums">
                        {formatMoney(o.total)}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {o.payment_method}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
