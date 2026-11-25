import { Languages } from 'lucide-react'
import { NetworkStatusPill } from '@/components/network-status-pill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Language } from '@/db'
import { useI18n } from '@/i18n'
import { MobileMenuButton } from './mobile-nav'

interface AppHeaderProps {
  shopName: string
  title: string
}

export function AppHeader({ shopName, title }: AppHeaderProps) {
  const { t, language, setLanguage } = useI18n()

  function changeLanguage(next: Language) {
    setLanguage(next)
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <MobileMenuButton shopName={shopName} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
            {title}
          </h2>
          <p className="truncate text-xs text-muted-foreground lg:hidden">
            {shopName || t('appName')}
          </p>
        </div>

        <NetworkStatusPill />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ur' ? t('urdu') : t('english')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              {t('english')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ur')}>
              {t('urdu')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
