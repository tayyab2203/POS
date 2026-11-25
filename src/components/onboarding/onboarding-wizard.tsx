import {
  CheckCircle2,
  Cookie,
  Loader2,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  loadSampleDemoData,
  updateSettings,
  type BusinessType,
  type Language,
  type Settings,
} from '@/db'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

interface OnboardingWizardProps {
  settings: Settings
  onComplete: () => void
}

type Step = 0 | 1 | 2 | 3

const BUSINESS_OPTIONS: {
  type: BusinessType
  icon: typeof UtensilsCrossed
  titleKey: 'businessFood' | 'businessRetail' | 'businessBakery'
  descKey: 'businessFoodDesc' | 'businessRetailDesc' | 'businessBakeryDesc'
}[] = [
  {
    type: 'food',
    icon: UtensilsCrossed,
    titleKey: 'businessFood',
    descKey: 'businessFoodDesc',
  },
  {
    type: 'retail',
    icon: Store,
    titleKey: 'businessRetail',
    descKey: 'businessRetailDesc',
  },
  {
    type: 'bakery',
    icon: Cookie,
    titleKey: 'businessBakery',
    descKey: 'businessBakeryDesc',
  },
]

export function OnboardingWizard({
  settings,
  onComplete,
}: OnboardingWizardProps) {
  const { t, setLanguage, language, dir } = useI18n()
  // Super Admin already set business type (+ usually shop name) in the cloud.
  const cloudProvisioned = Boolean(settings.shopName?.trim())
  const firstStep: Step = cloudProvisioned ? 1 : 0
  const [step, setStep] = useState<Step>(firstStep)
  const [businessType, setBusinessType] = useState<BusinessType>(
    settings.businessType || 'food',
  )
  const [shopName, setShopName] = useState(settings.shopName)
  const [address, setAddress] = useState(settings.address)
  const [phone, setPhone] = useState(settings.phone)
  const [ownerWhatsApp, setOwnerWhatsApp] = useState(settings.ownerWhatsApp)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)

  const totalSteps = cloudProvisioned ? 3 : 4
  const progress = useMemo(() => {
    const index = cloudProvisioned ? Math.max(0, step - 1) : step
    return ((index + 1) / totalSteps) * 100
  }, [step, cloudProvisioned, totalSteps])

  function chooseLanguage(next: Language) {
    setLanguage(next)
  }

  async function finish(loadDemo: boolean) {
    if (!shopName.trim()) {
      setNameError(true)
      setStep(1)
      toast.error(t('requiredField'))
      return
    }

    setSaving(true)
    try {
      await updateSettings({
        businessType,
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        ownerWhatsApp: ownerWhatsApp.trim(),
        language,
        onboardingComplete: true,
      })

      if (loadDemo) {
        const result = await loadSampleDemoData(businessType, {
          replaceExisting: true,
        })
        toast.success(
          `${result.products} products · ${result.categories} categories`,
        )
      }

      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-50 px-4 py-8"
      dir={dir}
    >
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('onboardingWelcome')}</CardTitle>
            <CardDescription className="mt-2 text-base">
              {t('onboardingSubtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('chooseBusiness')}
              </h3>
              <div className="grid gap-3">
                {BUSINESS_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const selected = businessType === option.type
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setBusinessType(option.type)}
                      className={cn(
                        'flex items-start gap-4 rounded-xl border-2 p-4 text-start transition-colors',
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white hover:border-slate-400',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                          selected ? 'bg-white/15' : 'bg-slate-100',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{t(option.titleKey)}</div>
                        <p
                          className={cn(
                            'mt-1 text-sm',
                            selected ? 'text-white/80' : 'text-muted-foreground',
                          )}
                        >
                          {t(option.descKey)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('shopDetails')}
              </h3>
              {cloudProvisioned ? (
                <p className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
                  {t('businessType')}:{' '}
                  <span className="font-medium text-foreground">
                    {businessType === 'food'
                      ? t('businessFood')
                      : businessType === 'retail'
                        ? t('businessRetail')
                        : t('businessBakery')}
                  </span>
                  <span className="ms-1">({t('setByAdmin')})</span>
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="shopName">{t('shopName')}</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value)
                    setNameError(false)
                  }}
                  placeholder="e.g. Al-Rehman Biryani"
                  className={cn(nameError && 'border-destructive')}
                />
                {nameError ? (
                  <p className="text-xs text-destructive">{t('requiredField')}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('shopAddress')}</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Main Bazaar, Lahore"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('shopPhone')}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa">{t('ownerWhatsApp')}</Label>
                  <Input
                    id="wa"
                    value={ownerWhatsApp}
                    onChange={(e) => setOwnerWhatsApp(e.target.value)}
                    placeholder="923001234567"
                    inputMode="tel"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('chooseLanguage')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { id: 'en' as const, label: t('english') },
                  { id: 'ur' as const, label: t('urdu') },
                ]).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => void chooseLanguage(option.id)}
                    className={cn(
                      'rounded-xl border-2 px-4 py-6 text-lg font-semibold transition-colors',
                      language === option.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-400',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold">{t('loadDemoData')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('loadDemoDataDesc')}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                className="h-12 w-full text-base"
                disabled={saving}
                onClick={() => void finish(true)}
              >
                {saving ? <Loader2 className="animate-spin" /> : null}
                {t('yesLoadDemo')}
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full text-base"
                disabled={saving}
                onClick={() => void finish(false)}
              >
                {t('startEmpty')}
              </Button>
            </div>
          ) : null}

          {step < 3 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={step <= firstStep || saving}
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                {t('back')}
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (step === 1 && !shopName.trim()) {
                    setNameError(true)
                    toast.error(t('requiredField'))
                    return
                  }
                  setStep((s) => (s + 1) as Step)
                }}
              >
                {t('continue')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
