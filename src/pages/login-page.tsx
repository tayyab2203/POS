import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface LoginPageProps {
  onSuccess: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { t, language, setLanguage, dir } = useI18n()
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error(t('requiredField'))
      return
    }
    try {
      await signIn(email, password)
      toast.success(t('loginSuccess'))
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loginFailed'))
    }
  }

  return (
    <div
      className="flex min-h-svh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-4"
      dir={dir}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('appName')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === 'en' ? 'default' : 'outline'}
            onClick={() => setLanguage('en')}
          >
            {t('english')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === 'ur' ? 'default' : 'outline'}
            onClick={() => setLanguage('ur')}
          >
            {t('urdu')}
          </Button>
        </div>

        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              data-no-barcode="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className={cn('h-4 w-4 animate-spin')} />
            ) : (
              t('signIn')
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('loginOfflineHint')}
        </p>
      </div>
    </div>
  )
}
