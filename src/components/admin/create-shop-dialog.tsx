import { Check, Copy } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n, type TranslationKey } from '@/i18n'
import {
  normalizePkPhone,
  validateCreateShop,
  type FieldErrors,
} from '@/lib/admin-validation'
import { cn } from '@/lib/utils'
import {
  createShopOwner,
  type CreateShopOwnerResult,
} from '@/services/adminApi'

interface CreateShopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

function errorKey(code: string | undefined): TranslationKey | null {
  if (!code) return null
  if (code === 'required') return 'requiredField'
  if (code === 'min2') return 'validationMin2'
  if (code === 'max80') return 'validationMax80'
  if (code === 'email') return 'validationEmail'
  if (code === 'phone') return 'validationPhone'
  if (code === 'passwordMin') return 'validationPasswordMin'
  if (code === 'passwordMax') return 'validationPasswordMax'
  if (code === 'trialDays') return 'validationTrialDays'
  return 'requiredField'
}

export function CreateShopDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateShopDialogProps) {
  const { t, dir } = useI18n()
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [created, setCreated] = useState<
    (CreateShopOwnerResult & { password: string; shopName: string }) | null
  >(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [businessType, setBusinessType] = useState<'food' | 'retail' | 'bakery'>(
    'food',
  )
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic')
  const [trialDays, setTrialDays] = useState('14')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const liveErrors = useMemo(
    () =>
      validateCreateShop({
        shopName,
        ownerName,
        ownerPhone,
        email,
        password,
        trialDays,
      }),
    [shopName, ownerName, ownerPhone, email, password, trialDays],
  )

  function resetForm() {
    setShopName('')
    setOwnerName('')
    setOwnerPhone('')
    setBusinessType('food')
    setPlan('basic')
    setTrialDays('14')
    setEmail('')
    setPassword('')
    setCreated(null)
    setErrors({})
    setTouched({})
    setConfirmOpen(false)
  }

  function showError(field: string): string | null {
    if (!touched[field] && !errors[field]) return null
    const key = errorKey(errors[field] ?? liveErrors[field])
    return key ? t(key) : null
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validateCreateShop({
      shopName,
      ownerName,
      ownerPhone,
      email,
      password,
      trialDays,
    })
    setErrors(next)
    setTouched({
      shopName: true,
      ownerName: true,
      ownerPhone: true,
      email: true,
      password: true,
      trialDays: true,
    })
    if (Object.keys(next).length) {
      toast.error(t('validationFixForm'))
      return
    }
    setConfirmOpen(true)
  }

  async function createConfirmed() {
    setBusy(true)
    try {
      const phone = ownerPhone.trim()
        ? normalizePkPhone(ownerPhone.trim())
        : ''
      const result = await createShopOwner({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: phone,
        businessType,
        plan,
        trialDays: Math.max(1, Number(trialDays) || 14),
        email: email.trim().toLowerCase(),
        password,
      })
      setConfirmOpen(false)
      setCreated({
        ...result,
        password,
        shopName: shopName.trim(),
      })
      toast.success(t('adminShopCreated'))
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adminCreateFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function copyCredentials() {
    if (!created) return
    const text = [
      `Shop: ${created.shopName}`,
      `Email: ${created.email}`,
      `Password: ${created.password}`,
      `Expires: ${new Date(created.expiresAt).toLocaleDateString()}`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    toast.success(t('copied'))
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetForm()
          onOpenChange(next)
        }}
      >
        <DialogContent
          dir={dir}
          className="max-h-[90svh] max-w-lg overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{t('adminOnboardShop')}</DialogTitle>
            <DialogDescription>{t('adminOnboardDesc')}</DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <p className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
                  <Check className="h-4 w-4" />
                  {t('adminWelcomeCredentials')}
                </p>
                <dl className="space-y-1.5 text-emerald-950">
                  <div className="flex justify-between gap-2">
                    <dt className="text-emerald-800/80">{t('shopName')}</dt>
                    <dd className="font-medium">{created.shopName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-emerald-800/80">{t('email')}</dt>
                    <dd className="font-medium">{created.email}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-emerald-800/80">{t('password')}</dt>
                    <dd className="font-mono font-medium">{created.password}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-emerald-800/80">{t('expiryDate')}</dt>
                    <dd className="font-medium">
                      {new Date(created.expiresAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void copyCredentials()}>
                  <Copy className="h-4 w-4" />
                  {t('copyCredentials')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    onOpenChange(false)
                  }}
                >
                  {t('done')}
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit} noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  label={t('shopName')}
                  error={showError('shopName')}
                >
                  <Input
                    value={shopName}
                    onBlur={() => setTouched((s) => ({ ...s, shopName: true }))}
                    onChange={(e) => setShopName(e.target.value)}
                    className={cn(showError('shopName') && 'border-destructive')}
                  />
                </Field>
                <Field label={t('ownerName')} error={showError('ownerName')}>
                  <Input
                    value={ownerName}
                    onBlur={() =>
                      setTouched((s) => ({ ...s, ownerName: true }))
                    }
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={cn(
                      showError('ownerName') && 'border-destructive',
                    )}
                  />
                </Field>
                <Field label={t('shopPhone')} error={showError('ownerPhone')}>
                  <Input
                    value={ownerPhone}
                    onBlur={() =>
                      setTouched((s) => ({ ...s, ownerPhone: true }))
                    }
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="0300xxxxxxx"
                    className={cn(
                      showError('ownerPhone') && 'border-destructive',
                    )}
                  />
                </Field>
                <Field label={t('businessType')}>
                  <Select
                    value={businessType}
                    onValueChange={(v) =>
                      setBusinessType(v as 'food' | 'retail' | 'bakery')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">{t('businessFood')}</SelectItem>
                      <SelectItem value="retail">
                        {t('businessRetail')}
                      </SelectItem>
                      <SelectItem value="bakery">
                        {t('businessBakery')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('adminPlan')}>
                  <Select
                    value={plan}
                    onValueChange={(v) => setPlan(v as 'basic' | 'pro')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{t('planBasic')}</SelectItem>
                      <SelectItem value="pro">{t('planPro')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('trialDays')} error={showError('trialDays')}>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={trialDays}
                    onBlur={() =>
                      setTouched((s) => ({ ...s, trialDays: true }))
                    }
                    onChange={(e) => setTrialDays(e.target.value)}
                    className={cn(
                      showError('trialDays') && 'border-destructive',
                    )}
                  />
                </Field>
                <Field label={t('email')} error={showError('email')}>
                  <Input
                    type="email"
                    value={email}
                    onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(showError('email') && 'border-destructive')}
                  />
                </Field>
                <Field
                  className="sm:col-span-2"
                  label={t('password')}
                  error={showError('password')}
                >
                  <Input
                    type="text"
                    autoComplete="new-password"
                    value={password}
                    onBlur={() =>
                      setTouched((s) => ({ ...s, password: true }))
                    }
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className={cn(
                      showError('password') && 'border-destructive',
                    )}
                  />
                </Field>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {t('adminCreateShop')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmCreateShopTitle')}
        description={t('confirmCreateShopBody')
          .replace('{shop}', shopName.trim())
          .replace('{email}', email.trim().toLowerCase())}
        confirmLabel={t('adminCreateShop')}
        busy={busy}
        onConfirm={() => void createConfirmed()}
      />
    </>
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
