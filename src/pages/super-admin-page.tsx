import {
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Store,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AdminSidebar,
  type AdminNavId,
} from '@/components/admin/admin-sidebar'
import { CreateShopDialog } from '@/components/admin/create-shop-dialog'
import { ShopDetailSheet } from '@/components/admin/shop-detail-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdminRealtime } from '@/hooks/use-admin-realtime'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  computeAdminKpis,
  daysUntilExpiry,
  fetchAllShops,
  fetchMonthRevenue,
  fetchRecentPayments,
  filterShops,
  isExpiringSoon,
  type ShopFilterTab,
} from '@/services/adminApi'
import { useAuthStore } from '@/stores/auth-store'
import type { ShopRow, SubscriptionPaymentRow } from '@/types/supabase'

const COLLAPSE_KEY = 'pos_admin_sidebar_collapsed'

function statusBadgeVariant(
  status: ShopRow['status'],
): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'active') return 'success'
  if (status === 'trial' || status === 'grace') return 'warning'
  if (status === 'suspended') return 'destructive'
  return 'secondary'
}

function isShopFilter(id: AdminNavId): id is ShopFilterTab {
  return (
    id === 'all' ||
    id === 'active' ||
    id === 'trial' ||
    id === 'expiring' ||
    id === 'suspended'
  )
}

export function SuperAdminPage() {
  const { t, language, setLanguage, dir } = useI18n()
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

  const [shops, setShops] = useState<ShopRow[]>([])
  const [payments, setPayments] = useState<SubscriptionPaymentRow[]>([])
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState<AdminNavId>('overview')
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<ShopRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [rows, monthRevenue, recentPay] = await Promise.all([
        fetchAllShops(),
        fetchMonthRevenue(),
        fetchRecentPayments(),
      ])
      setShops(rows)
      setRevenue(monthRevenue)
      setPayments(recentPay)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adminLoadFailed'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  useAdminRealtime({
    onShopChange: (shop, event) => {
      setShops((prev) => {
        if (event === 'DELETE') return prev.filter((s) => s.id !== shop.id)
        const idx = prev.findIndex((s) => s.id === shop.id)
        if (idx === -1) return event === 'INSERT' ? [shop, ...prev] : prev
        const next = [...prev]
        next[idx] = { ...next[idx], ...shop }
        return next
      })
      setSelected((cur) => (cur?.id === shop.id ? { ...cur, ...shop } : cur))
    },
    onPaymentInsert: (payment) => {
      setPayments((prev) =>
        prev.some((p) => p.id === payment.id) ? prev : [payment, ...prev],
      )
      setRevenue((r) => {
        const created = new Date(payment.created_at)
        const now = new Date()
        if (
          created.getUTCFullYear() === now.getUTCFullYear() &&
          created.getUTCMonth() === now.getUTCMonth()
        ) {
          return r + Number(payment.amount || 0)
        }
        return r
      })
      toast.success(t('adminPaymentLive'), {
        description: formatMoney(Number(payment.amount || 0)),
      })
    },
  })

  const kpis = useMemo(
    () => computeAdminKpis(shops, revenue),
    [shops, revenue],
  )

  const shopTab: ShopFilterTab = isShopFilter(nav) ? nav : 'all'

  const filtered = useMemo(
    () => filterShops(shops, shopTab, query),
    [shops, shopTab, query],
  )

  const shopNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of shops) map.set(s.id, s.name)
    return map
  }, [shops])

  function openShop(shop: ShopRow) {
    setSelected(shop)
    setDetailOpen(true)
  }

  function onShopUpdated(next: ShopRow) {
    setShops((prev) => prev.map((s) => (s.id === next.id ? next : s)))
    setSelected(next)
  }

  function onCollapsedChange(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  function onNavigate(id: AdminNavId) {
    setNav(id === 'shops' ? 'all' : id)
    setMobileNav(false)
  }

  const kpiCards = [
    { label: t('kpiTotalShops'), value: String(kpis.totalShops), id: 'all' as const },
    { label: t('kpiActiveShops'), value: String(kpis.activeShops), id: 'active' as const },
    { label: t('kpiTrialShops'), value: String(kpis.trialShops), id: 'trial' as const },
    { label: t('kpiExpiringSoon'), value: String(kpis.expiringSoon), id: 'expiring' as const },
    { label: t('kpiSuspended'), value: String(kpis.suspended), id: 'suspended' as const },
    {
      label: t('kpiRevenueMonth'),
      value: formatMoney(kpis.revenueThisMonth),
      id: 'payments' as const,
    },
  ]

  const showShopTable = nav === 'overview' || isShopFilter(nav)
  const showPayments = nav === 'overview' || nav === 'payments'

  const sidebar = (
    <AdminSidebar
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      active={nav === 'all' ? 'shops' : nav}
      onNavigate={onNavigate}
      counts={{
        all: kpis.totalShops,
        active: kpis.activeShops,
        trial: kpis.trialShops,
        expiring: kpis.expiringSoon,
        suspended: kpis.suspended,
        paymentsMonth: payments.filter((p) => {
          const d = new Date(p.created_at)
          const now = new Date()
          return (
            d.getUTCFullYear() === now.getUTCFullYear() &&
            d.getUTCMonth() === now.getUTCMonth()
          )
        }).length,
      }}
      email={session?.email}
      onCreateShop={() => {
        setCreateOpen(true)
        setMobileNav(false)
      }}
      onSignOut={() => void signOut()}
    />
  )

  return (
    <div className="flex h-svh overflow-hidden bg-slate-100" dir={dir}>
      <div className="hidden lg:flex">{sidebar}</div>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative z-10">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold">
                {nav === 'payments'
                  ? t('adminNavPayments')
                  : nav === 'overview'
                    ? t('adminNavOverview')
                    : t('adminShopsDirectory')}
              </h1>
              <p className="text-[11px] text-emerald-700">
                {t('adminLiveUpdates')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                EN
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === 'ur' ? 'default' : 'outline'}
                onClick={() => setLanguage('ur')}
              >
                UR
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
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
              <Button
                type="button"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('adminOnboardShop')}
              </Button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto px-3 py-5 sm:px-5">
          <div className="mx-auto max-w-7xl space-y-5">
            {(nav === 'overview' || isShopFilter(nav)) && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpiCards.map((card) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => onNavigate(card.id)}
                    className="text-start"
                  >
                    <Card className="shadow-sm transition hover:border-slate-400">
                      <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          {card.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xl font-bold tabular-nums tracking-tight">
                          {card.value}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}

            {showShopTable ? (
              <Card className="shadow-sm">
                <CardHeader className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Store className="h-4 w-4" />
                      {t('adminShopsDirectory')}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {filtered.length} / {shops.length}
                    </p>
                  </div>
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      placeholder={t('adminSearchShops')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading && shops.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading')}
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {t('adminNoShops')}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-y bg-slate-50 text-start text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3 font-medium">
                              {t('shopName')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('ownerName')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('adminPlan')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('status')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('expiryDate')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('lastSynced')}
                            </th>
                            <th className="px-4 py-3 font-medium">
                              {t('actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((shop) => {
                            const days = daysUntilExpiry(shop.expires_at)
                            return (
                              <tr
                                key={shop.id}
                                className="border-b last:border-0 hover:bg-slate-50/80"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-medium">{shop.name}</div>
                                  <div className="text-xs capitalize text-muted-foreground">
                                    {shop.business_type}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div>{shop.owner_name || '—'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {shop.owner_phone || '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      shop.plan === 'pro'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {shop.plan}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    <Badge
                                      variant={statusBadgeVariant(shop.status)}
                                    >
                                      {shop.status}
                                    </Badge>
                                    {isExpiringSoon(shop) ? (
                                      <Badge variant="warning">
                                        {t('filterExpiring')}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-4 py-3 tabular-nums">
                                  <div>
                                    {new Date(
                                      shop.expires_at,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div
                                    className={cn(
                                      'text-xs',
                                      days < 0
                                        ? 'text-destructive'
                                        : days <= 5
                                          ? 'text-amber-700'
                                          : 'text-muted-foreground',
                                    )}
                                  >
                                    {days >= 0
                                      ? `${days}d left`
                                      : `${Math.abs(days)}d overdue`}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  {shop.last_sync_at
                                    ? new Date(
                                        shop.last_sync_at,
                                      ).toLocaleString()
                                    : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openShop(shop)}
                                  >
                                    {t('manage')}
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {showPayments && (nav === 'payments' || nav === 'overview') ? (
              <Card className="shadow-sm">
                <CardHeader className="p-4 sm:p-5">
                  <CardTitle className="text-base">
                    {t('adminNavPayments')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {payments.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      {t('adminNoPayments')}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {(nav === 'overview' ? payments.slice(0, 8) : payments).map(
                        (p) => (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {shopNameById.get(p.shop_id) ?? p.shop_id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.method} · +{p.days_added}d
                                {p.note ? ` · ${p.note}` : ''}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="font-semibold tabular-nums">
                                {formatMoney(Number(p.amount))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.created_at).toLocaleString()}
                              </p>
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </main>
      </div>

      <CreateShopDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load(true)}
      />
      <ShopDetailSheet
        shop={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={onShopUpdated}
      />
    </div>
  )
}
