import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PauseCircle,
  Plus,
  Store,
  Timer,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import type { ShopFilterTab } from '@/services/adminApi'

export type AdminNavId =
  | 'overview'
  | 'shops'
  | 'payments'
  | ShopFilterTab

export interface AdminNavCounts {
  all: number
  active: number
  trial: number
  expiring: number
  suspended: number
  paymentsMonth: number
}

interface AdminSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  active: AdminNavId
  onNavigate: (id: AdminNavId) => void
  counts: AdminNavCounts
  email?: string
  onCreateShop: () => void
  onSignOut: () => void
}

function CountPill({
  value,
  tone,
  collapsed,
}: {
  value: number
  tone?: 'default' | 'warn' | 'danger'
  collapsed?: boolean
}) {
  if (collapsed) {
    return value > 0 ? (
      <span
        className={cn(
          'absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white',
          tone === 'warn' && 'bg-amber-500',
          tone === 'danger' && 'bg-red-600',
          (!tone || tone === 'default') && 'bg-slate-900',
        )}
      >
        {value > 99 ? '99+' : value}
      </span>
    ) : null
  }
  return (
    <Badge
      variant={
        tone === 'danger'
          ? 'destructive'
          : tone === 'warn'
            ? 'warning'
            : 'secondary'
      }
      className="tabular-nums"
    >
      {value}
    </Badge>
  )
}

export function AdminSidebar({
  collapsed,
  onCollapsedChange,
  active,
  onNavigate,
  counts,
  email,
  onCreateShop,
  onSignOut,
}: AdminSidebarProps) {
  const { t } = useI18n()

  const overviewItems = [
    {
      id: 'overview' as const,
      label: t('adminNavOverview'),
      icon: LayoutDashboard,
    },
  ]

  const shopItems = [
    {
      id: 'shops' as const,
      label: t('filterAll'),
      icon: Store,
      count: counts.all,
    },
    {
      id: 'active' as const,
      label: t('filterActive'),
      icon: Store,
      count: counts.active,
    },
    {
      id: 'trial' as const,
      label: t('filterTrial'),
      icon: Timer,
      count: counts.trial,
      tone: 'warn' as const,
    },
    {
      id: 'expiring' as const,
      label: t('filterExpiring'),
      icon: AlertTriangle,
      count: counts.expiring,
      tone: 'warn' as const,
    },
    {
      id: 'suspended' as const,
      label: t('filterSuspended'),
      icon: PauseCircle,
      count: counts.suspended,
      tone: 'danger' as const,
    },
  ]

  const billingItems = [
    {
      id: 'payments' as const,
      label: t('adminNavPayments'),
      icon: Wallet,
      count: counts.paymentsMonth,
    },
  ]

  function NavButton({
    id,
    label,
    icon: Icon,
    count,
    tone,
  }: {
    id: AdminNavId
    label: string
    icon: typeof Store
    count?: number
    tone?: 'default' | 'warn' | 'danger'
  }) {
    const isActive = active === id || (id === 'shops' && active === 'all')
    return (
      <button
        type="button"
        title={collapsed ? label : undefined}
        onClick={() => onNavigate(id === 'shops' ? 'all' : id)}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="flex-1 text-start">{label}</span> : null}
        {typeof count === 'number' ? (
          <CountPill
            value={count}
            tone={tone}
            collapsed={collapsed}
          />
        ) : null}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-svh shrink-0 flex-col border-e bg-white transition-[width] duration-200',
        collapsed ? 'w-[4.25rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 border-b px-3 py-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          SA
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t('superAdminTitle')}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {email}
            </p>
          </div>
        ) : null}
      </div>

      <div className="p-2">
        <Button
          type="button"
          className={cn('w-full gap-2', collapsed && 'px-0')}
          size="sm"
          onClick={onCreateShop}
        >
          <Plus className="h-4 w-4" />
          {!collapsed ? t('adminOnboardShop') : null}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <p
          className={cn(
            'px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
            collapsed && 'sr-only',
          )}
        >
          {t('adminNavSectionMain')}
        </p>
        <div className="space-y-1">
          {overviewItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}
        </div>

        <p
          className={cn(
            'px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
            collapsed && 'sr-only',
          )}
        >
          {t('adminNavSectionShops')}
        </p>
        <div className="space-y-1">
          {shopItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}
        </div>

        <p
          className={cn(
            'px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
            collapsed && 'sr-only',
          )}
        >
          {t('adminNavSectionBilling')}
        </p>
        <div className="space-y-1">
          {billingItems.map((item) => (
            <NavButton key={item.id} {...item} />
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('w-full gap-2', collapsed && 'px-0')}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              {t('collapseSidebar')}
            </>
          )}
        </Button>
        <Separator />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('w-full gap-2', collapsed && 'px-0')}
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? t('signOut') : null}
        </Button>
      </div>
    </aside>
  )
}
