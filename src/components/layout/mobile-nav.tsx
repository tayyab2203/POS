import { Menu, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useI18n } from '@/i18n'
import { useSessionStore, type AppModule } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

const BOTTOM_IDS: AppModule[] = ['pos', 'orders', 'products', 'expenses', 'khata']

interface MobileNavProps {
  shopName: string
}

export function MobileBottomNav() {
  const { t } = useI18n()
  const activeModule = useSessionStore((s) => s.activeModule)
  const requestModule = useSessionStore((s) => s.requestModule)
  const khataEnabled = useFeatureFlag('enableKhata')

  const bottomItems = NAV_ITEMS.filter((item) => {
    if (!BOTTOM_IDS.includes(item.id)) return false
    if (item.featureFlag === 'enableKhata' && !khataEnabled) return false
    return true
  })

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div
        className={cn(
          'grid gap-1 px-1 py-1.5',
          bottomItems.length >= 5 ? 'grid-cols-5' : 'grid-cols-4',
        )}
      >
        {bottomItems.map((item) => {
          const Icon = item.icon
          const active = activeModule === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => requestModule(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium',
                active ? 'bg-slate-900 text-white' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileMenuButton({ shopName }: MobileNavProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const activeModule = useSessionStore((s) => s.activeModule)
  const role = useSessionStore((s) => s.role)
  const requestModule = useSessionStore((s) => s.requestModule)
  const openPinModal = useSessionStore((s) => s.openPinModal)
  const lockOwner = useSessionStore((s) => s.lockOwner)
  const cloudRole = useAuthStore((s) => s.session?.role)
  const khataEnabled = useFeatureFlag('enableKhata')
  const items = NAV_ITEMS.filter((item) => {
    if (item.cloudOwnerOnly && cloudRole !== 'shop_owner') return false
    if (item.featureFlag === 'enableKhata' && !khataEnabled) return false
    return true
  })

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t('menu')}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="border-b px-4 py-5 text-start">
            <SheetTitle>{shopName || t('appName')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 p-3">
            {items.map((item) => {
              const Icon = item.icon
              const active = activeModule === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    requestModule(item.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </button>
              )
            })}
          </div>
          <div className="mt-auto space-y-2 border-t p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {role === 'owner' ? t('ownerMode') : t('cashierMode')}
            </div>
            {role === 'owner' ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  lockOwner()
                  setOpen(false)
                }}
              >
                {t('logoutOwner')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  openPinModal(null)
                }}
              >
                {t('unlockOwner')}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
