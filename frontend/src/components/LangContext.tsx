'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Lang, Translations } from '../lib/i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
  t: translations.zh,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'zh') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className={`text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors font-mono ${className}`}
    >
      {lang === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
