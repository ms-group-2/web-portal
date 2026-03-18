export type Language = 'ka' | 'en';

const LOCALE_COOKIE_KEY = 'app_locale';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
}

export function getSavedLanguage(): Language {
  const fromCookie = readCookie(LOCALE_COOKIE_KEY);
  return fromCookie === 'en' || fromCookie === 'ka' ? fromCookie : 'ka';
}

export function saveLanguage(lang: Language): void {
  writeCookie(LOCALE_COOKIE_KEY, lang);
}

import kaBase from '../../assets/i18n/ka.json';
import enBase from '../../assets/i18n/en.json';

import kaAuth from '../../assets/i18n/ka/auth.json';
import enAuth from '../../assets/i18n/en/auth.json';

import kaLanding from '../../assets/i18n/ka/landing.json';
import enLanding from '../../assets/i18n/en/landing.json';

import kaProfile from '../../assets/i18n/ka/profile.json';
import enProfile from '../../assets/i18n/en/profile.json';

import kaShop from '../../assets/i18n/ka/shop.json';
import enShop from '../../assets/i18n/en/shop.json';

import kaSwap from '../../assets/i18n/ka/swap.json';
import enSwap from '../../assets/i18n/en/swap.json';

import kaValidation from '../../assets/i18n/ka/validation.json';
import enValidation from '../../assets/i18n/en/validation.json';

import kaVendor from '../../assets/i18n/ka/vendor.json';
import enVendor from '../../assets/i18n/en/vendor.json';

export const I18N: Record<Language, Record<string, any>> = {
  ka: {
    ...(kaBase as any),
    ...(kaAuth as any),
    ...(kaLanding as any),
    ...(kaProfile as any),
    ...(kaShop as any),
    ...(kaSwap as any),
    ...(kaValidation as any),
    ...(kaVendor as any),
  },
  en: {
    ...(enBase as any),
    ...(enAuth as any),
    ...(enLanding as any),
    ...(enProfile as any),
    ...(enShop as any),
    ...(enSwap as any),
    ...(enValidation as any),
    ...(enVendor as any),
  },
};

