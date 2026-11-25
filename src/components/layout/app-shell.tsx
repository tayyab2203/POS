import type { ReactNode } from 'react'
import type { BusinessType } from '@/db'
import { useI18n } from '@/i18n'
import { useSessionStore } from '@/stores'
import { cn } from '@/lib/utils'
import { AppHeader } from './app-header'
import { MobileBottomNav } from './mobile-nav'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
  shopName: string
  businessType: BusinessType
  children: ReactNode
}

function businessLabel(type: BusinessType, language: 'en' | 'ur') {
  if (language === 'ur') {
    if (type === 'food') return 'کھانا / ریسٹورنٹ'
    if (type === 'retail') return 'جنرل سٹور'
    return 'بیکری / مٹھائی'
  }
  if (type === 'food') return 'Food / Restaurant'
  if (type === 'retail') return 'General Store'
  return 'Bakery / Sweets'
}

export function AppShell({ shopName, businessType, children }: AppShellProps) {
  const { t, language } = useI18n()
  const activeModule = useSessionStore((s) => s.activeModule)

  const moduleTitleMap = {
    pos: t('pos'),
    orders: t('orders'),
    products: t('products'),
    expenses: t('expenses'),
    khata: t('khata'),
    liveCloud: t('liveCloud'),
    reports: t('reports'),
    settings: t('settings'),
  } as const

  const isPos = activeModule === 'pos'

  return (
    <div className="flex h-svh overflow-hidden bg-slate-100">
      <SidebarNav
        shopName={shopName}
        businessLabel={businessLabel(businessType, language)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader
          shopName={shopName}
          title={moduleTitleMap[activeModule]}
        />
        <main
          className={cn(
            'min-h-0 flex-1',
            isPos ? 'overflow-hidden pb-[3.75rem] lg:pb-0' : 'overflow-auto pb-24 lg:pb-6',
          )}
        >
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
