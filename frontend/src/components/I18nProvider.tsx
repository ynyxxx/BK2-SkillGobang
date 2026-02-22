'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, translate } from '../lib/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh');

  useEffect(() => {
    const stored = window.localStorage.getItem('locale');
    if (stored === 'zh' || stored === 'en') {
      setLocale(stored);
      return;
    }
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('en')) {
      setLocale('en');
    }
  }, []);

  const updateLocale = (next: Locale) => {
    setLocale(next);
    window.localStorage.setItem('locale', next);
  };

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: updateLocale,
    t: (key, params) => translate(locale, key, params),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
