import en from "@/messages/en.json";
import lt from "@/messages/lt.json";

export const locales = ["en", "lt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "lt";

export type Messages = typeof en;

const messages: Record<Locale, Messages> = { en, lt };

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }
  return defaultLocale;
}

export function localePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}
