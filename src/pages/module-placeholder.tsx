import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n'

interface ModulePlaceholderProps {
  title: string
  icon: LucideIcon
}

export function ModulePlaceholder({ title, icon: Icon }: ModulePlaceholderProps) {
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon className="h-5 w-5" />
            </span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p className="text-base font-medium text-slate-800">{t('comingSoon')}</p>
          <p className="text-sm">{t('modulePlaceholder')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
