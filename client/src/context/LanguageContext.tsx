import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '../types';
import { getInitialLanguage, SUPPORTED_LANGUAGES } from '../i18n/config';
import { formatDate as formatLocalDate, formatCurrency as formatLocalCurrency, formatNumber as formatLocalNumber } from '../utils/formatters';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languageNames: Record<SupportedLanguage, string>;
  t: (key: string, options?: any) => string;
  formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number | null | undefined) => string;
  formatNumber: (num: number | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    const validLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    setLanguageState(validLang);
    try {
      localStorage.setItem('preferredLanguage', validLang);
      localStorage.setItem('smart_livestock_lang', validLang);
    } catch {
      // safe fallback
    }
    i18n.changeLanguage(validLang);
  }, [i18n]);

  useEffect(() => {
    // Ensure i18n matches current state
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const formatDate = useCallback(
    (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
      return formatLocalDate(date, language, options);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number | null | undefined) => {
      return formatLocalCurrency(amount, language);
    },
    [language]
  );

  const formatNumber = useCallback(
    (num: number | null | undefined) => {
      return formatLocalNumber(num, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageNames,
        t,
        formatDate,
        formatCurrency,
        formatNumber,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
