import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppShell } from '@/components/layout/app-shell'
import { ClockTamperModal } from '@/components/license/clock-tamper-modal'
import { LicenseBanners } from '@/components/license/license-banners'
import { RenewalOverlay } from '@/components/license/renewal-overlay'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { OwnerPinModal } from '@/components/owner-pin-modal'
import { PrintHost } from '@/components/print/print-host'
import { PwaUpdateToast } from '@/components/pwa-update-toast'
import { Toaster } from '@/components/ui/sonner'
import {
  db,
  ensureInitialized,
  updateLanguage,
  type Language,
} from '@/db'
import { I18nProvider } from '@/i18n'
import { isSupabaseConfigured } from '@/lib/supabase'
import { markBackupExportedLocal, requestPersistentStorage } from '@/lib/storage'
import { LoginPage } from '@/pages/login-page'
import { ModuleRouter } from '@/pages/module-router'
import { SuperAdminGate } from '@/pages/super-admin-gate'
import { startSyncEngine, stopSyncEngine } from '@/services/syncEngine'
import { attachNetworkListeners } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useLicenseStore } from '@/stores/license-store'

function PosApp() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bootLanguage, setBootLanguage] = useState<Language>('en')
  const [dbEpoch, setDbEpoch] = useState(0)

  const authBootstrapped = useAuthStore((s) => s.bootstrapped)
  const authLoading = useAuthStore((s) => s.loading)
  const session = useAuthStore((s) => s.session)
  const shopId = session?.shopId ?? null
  const role = session?.role ?? null
  const userId = session?.userId ?? null
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const signOut = useAuthStore((s) => s.signOut)

  const settings = useLiveQuery(
    () => (ready ? db.settings.get('shop') : undefined),
    [ready, dbEpoch],
  )

  useEffect(() => {
    attachNetworkListeners()
    void requestPersistentStorage()
    void bootstrap()
  }, [bootstrap])

  // Re-init only when tenant/auth identity changes — not on every license
  // refresh (sync used to replace `session` and remount the whole UI).
  useEffect(() => {
    if (!authBootstrapped) return

    if (isSupabaseConfigured && !userId) {
      setReady(false)
      setError(null)
      stopSyncEngine()
      return
    }

    if (role === 'super_admin') {
      setReady(false)
      setError(null)
      stopSyncEngine()
      return
    }

    let cancelled = false
    setReady(false)
    setError(null)

    ensureInitialized(shopId)
      .then(async () => {
        const auth = useAuthStore.getState().session
        let row = await db.settings.get('shop')
        if (row?.lastBackupAt) markBackupExportedLocal(row.lastBackupAt)

        // Cloud shop already has name + business type from Super Admin —
        // seed local settings so device onboarding does not ask again.
        if (auth?.shop && row && !row.onboardingComplete) {
          row = {
            ...row,
            shopName: row.shopName || auth.shop.name,
            address: row.address || auth.shop.address || '',
            phone: row.phone || auth.shop.owner_phone || '',
            ownerWhatsApp:
              row.ownerWhatsApp ||
              auth.shop.owner_whatsapp ||
              auth.shop.owner_phone ||
              '',
            businessType: auth.shop.business_type || row.businessType,
            updatedAt: new Date().toISOString(),
          }
          await db.settings.put(row)
        }

        if (!cancelled) {
          setBootLanguage(row?.language ?? 'en')
          setDbEpoch((n) => n + 1)
          setReady(true)
          if (shopId) {
            await useLicenseStore.getState().hydrateFromShop(auth?.shop ?? null)
            await useLicenseStore.getState().tickClock()
            startSyncEngine()
          } else {
            useLicenseStore.getState().reset()
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize database',
          )
        }
      })

    const clockInterval = window.setInterval(() => {
      void useLicenseStore.getState().tickClock()
    }, 5 * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(clockInterval)
      stopSyncEngine()
    }
  }, [authBootstrapped, userId, shopId, role])

  const language = settings?.language ?? bootLanguage

  const handleLanguageChange = useCallback(
    (next: Language) => {
      setBootLanguage(next)
      if (ready) void updateLanguage(next)
    },
    [ready],
  )

  // Only block first paint — later sign-in loading must not remount the app
  if (!authBootstrapped || (authLoading && !session)) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Opening Local POS…</p>
      </div>
    )
  }

  if (isSupabaseConfigured && !session) {
    return (
      <I18nProvider language={bootLanguage} onLanguageChange={setBootLanguage}>
        <Toaster />
        <LoginPage onSuccess={() => undefined} />
      </I18nProvider>
    )
  }

  if (session?.role === 'super_admin') {
    return (
      <I18nProvider language={bootLanguage} onLanguageChange={setBootLanguage}>
        <Toaster />
        <SuperAdminGate />
      </I18nProvider>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-xl font-semibold text-destructive">
            Startup error
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          {isSupabaseConfigured ? (
            <button
              type="button"
              className="text-sm underline"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  if (!ready || !settings) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Opening Local POS…</p>
      </div>
    )
  }

  return (
    <I18nProvider language={language} onLanguageChange={handleLanguageChange}>
      <Toaster />
      <PwaUpdateToast />
      <PrintHost />
      <OwnerPinModal ownerPin={settings.ownerPin} />
      <ClockTamperModal />
      <RenewalOverlay />

      {!settings.onboardingComplete ? (
        <OnboardingWizard
          settings={settings}
          onComplete={() => {
            /* live query refreshes automatically */
          }}
        />
      ) : (
        <ErrorBoundary label="app-shell">
          <div className="flex h-full min-h-0 flex-col">
            <LicenseBanners />
            <div className="min-h-0 flex-1">
              <AppShell
                shopName={settings.shopName}
                businessType={settings.businessType}
              >
                <ModuleRouter
                  businessType={settings.businessType}
                  shopName={settings.shopName}
                />
              </AppShell>
            </div>
          </div>
        </ErrorBoundary>
      )}
    </I18nProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PosApp />} />
        <Route path="*" element={<PosApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
