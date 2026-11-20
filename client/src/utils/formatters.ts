import { SupportedLanguage } from '../types';

const LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

/**
 * Format a Date string or Date object into a localized date string.
 * Defaults to DD/MM/YYYY format standard in India, or localized representation.
 */
export const formatDate = (
  dateInput: string | Date | null | undefined,
  lang: SupportedLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const locale = LOCALE_MAP[lang] || 'en-IN';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    // Safe fallback to standard ISO/Indian date
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

/**
 * Format a numeric amount into an Indian Rupee currency string (₹).
 * Uses Indian numbering format (e.g., ₹1,25,000).
 */
export const formatCurrency = (
  amount: number | null | undefined,
  lang: SupportedLanguage = 'en'
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const locale = LOCALE_MAP[lang] || 'en-IN';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
    return `₹${formatted}`;
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
};

/**
 * Format a standard number according to Indian/system numbering.
 */
export const formatNumber = (
  num: number | null | undefined,
  lang: SupportedLanguage = 'en'
): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const locale = LOCALE_MAP[lang] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toLocaleString();
  }
};
