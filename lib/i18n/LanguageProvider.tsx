'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { translations, DEFAULT_LOCALE, type Locale } from './translations';

const STORAGE_KEY = 'fc-locale';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: typeof translations.th;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === 'th' || saved === 'en') {
        setLocaleState(saved);
      } else if (!navigator.language?.toLowerCase().startsWith('th')) {
        // first visit from a non-Thai browser -> start in English
        setLocaleState('en');
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    } catch { /* ignore */ }
  }, [locale, hydrated]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggle = useCallback(() => setLocaleState((p) => (p === 'th' ? 'en' : 'th')), []);

  const value: Ctx = {
    locale,
    setLocale,
    toggle,
    t: translations[locale] as typeof translations.th,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
