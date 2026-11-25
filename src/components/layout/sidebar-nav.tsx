import { Lock, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useI18n } from '@/i18n'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useSessionStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

interface SidebarNavProps {
  shopName: string
  businessLabel: string
}

export function SidebarNav({ shopName, businessLabel }: SidebarNavProps) {
  const { t } = useI18n()
  const activeModule = useSessionStore((s) => s.activeModule)
  const role = useSessionStore((s) => s.role)
  const requestModule = useSessionStore((s) => s.requestModule)
  const openPinModal = useSessionStore((s) => s.openPinModal)
  const lockOwner = useSessionStore((s) => s.lockOwner)
  const cloudRole = useAuthStore((s) => s.session?.role)
  const signOut = useAuthStore((s) => s.signOut)
  const khataEnabled = useFeatureFlag('enableKhata')

  const items = NAV_ITEMS.filter((item) => {
    if (item.cloudOwnerOnly && cloudRole !== 'shop_owner') return false
    if (item.featureFlag === 'enableKhata' && !khataEnabled) return false
    return true
  })

  return (
    <aside className="hidden h-svh w-64 shrink-0 flex-col border-e bg-white lg:flex">
      <div className="border-b px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          POS
        </div>
        <h1 className="mt-3 truncate text-base font-semibold tracking-tight">
          {shopName || t('appName')}
        </h1>
        <p className="truncate text-xs text-muted-foreground">{businessLabel}</p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = activeModule === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => requestModule(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-start">{t(item.labelKey)}</span>
                {item.requiresOwner && role !== 'owner' ? (
                  <Lock className="h-3.5 w-3.5 opacity-70" />
                ) : null}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="space-y-3 border-t p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {role === 'owner' ? t('ownerMode') : t('cashierMode')}
        </div>
        {role === 'owner' ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={lockOwner}
          >
            {t('logoutOwner')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => openPinModal(null)}
          >
            {t('unlockOwner')}
          </Button>
        )}
        {isSupabaseConfigured ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </Button>
        ) : null}
        <Separator />
        <p className="text-[11px] text-muted-foreground">
          Offline-first · Local Saved
        </p>
      </div>
    </aside>
  )
}
