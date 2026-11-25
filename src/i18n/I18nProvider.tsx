import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type { Language } from '@/db/types'
import { dictionaries, type TranslationKey } from './translations'

interface I18nContextValue {
  language: Language
  dir: 'ltr' | 'rtl'
  t: (key: TranslationKey) => string
  setLanguage: (language: Language) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  language: Language
  onLanguageChange: (language: Language) => void
  children: ReactNode
}

export function I18nProvider({
  language,
  onLanguageChange,
  children,
}: I18nProviderProps) {
  const dir: 'ltr' | 'rtl' = language === 'ur' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
  }, [language, dir])

  const t = useCallback(
    (key: TranslationKey) => dictionaries[language][key] ?? dictionaries.en[key],
    [language],
  )

  const value = useMemo(
    () => ({
      language,
      dir,
      t,
      setLanguage: onLanguageChange,
    }),
    [language, dir, t, onLanguageChange],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
