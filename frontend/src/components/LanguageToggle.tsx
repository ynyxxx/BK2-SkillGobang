'use client';

import React from 'react';
import { useI18n } from './I18nProvider';

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const isZh = locale === 'zh';

  return (
    <button
      onClick={() => setLocale(isZh ? 'en' : 'zh')}
      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
      title={isZh ? t('lang.switchToEn') : t('lang.switchToZh')}
      aria-label={isZh ? t('lang.switchToEn') : t('lang.switchToZh')}
    >
      {t('lang.zh')} / {t('lang.en')}
    </button>
  );
}
