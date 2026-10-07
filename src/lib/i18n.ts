import en from "@/messages/en.json";
import lt from "@/messages/lt.json";

export const locales = ["en", "lt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "lt";
export const localeCookieName = "playtennis-locale";

export type Messages = typeof en;

const messages: Record<Locale, Messages> = { en, lt };

const CANONICAL_SEGMENTS = ["tournaments", "saved", "about", "play", "quiz"] as const;

const PUBLIC_SEGMENT: Record<Locale, Record<string, string>> = {
  lt: {
    tournaments: "turnyrai",
    saved: "issaugoti",
    about: "apie",
    play: "zaidimas",
    quiz: "kvizas",
  },
  en: {
    tournaments: "tournaments",
    saved: "saved",
    about: "about",
    play: "play",
    quiz: "quiz",
  },
};

const SEGMENT_TO_CANONICAL: Record<string, string> = {
  turnyrai: "tournaments",
  tournaments: "tournaments",
  issaugoti: "saved",
  saved: "saved",
  apie: "about",
  about: "about",
  zaidimas: "play",
  play: "play",
  kvizas: "quiz",
  quiz: "quiz",
};

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/lt" || pathname.startsWith("/lt/")) return "lt";
  return defaultLocale;
}

function splitPath(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

export function toPublicPath(locale: Locale, pathname = "/"): string {
  const parts = splitPath(pathname);
  const rest = parts[0] === "lt" || parts[0] === "en" ? parts.slice(1) : parts;
  if (rest.length === 0) return `/${locale}`;

  const canonical = SEGMENT_TO_CANONICAL[rest[0]] ?? rest[0];
  const pub = PUBLIC_SEGMENT[locale][canonical] ?? canonical;
  return `/${locale}/${[pub, ...rest.slice(1)].join("/")}`;
}

export function localePath(locale: Locale, pathname?: string): string {
  return toPublicPath(locale, pathname ?? "/");
}

export function switchLocalePath(currentPathname: string, targetLocale: Locale): string {
  return toPublicPath(targetLocale, currentPathname);
}

export function preferredLocale(acceptLanguage: string | null, cookieValue: string | undefined): Locale {
  if (cookieValue === "en" || cookieValue === "lt") return cookieValue;

  const header = (acceptLanguage ?? "").toLowerCase();
  const ltAt = header.indexOf("lt");
  const enAt = header.indexOf("en");
  if (ltAt === -1 && enAt === -1) return defaultLocale;
  if (ltAt === -1) return "en";
  if (enAt === -1) return "lt";
  return ltAt < enAt ? "lt" : "en";
}

export function internalPathname(pathname: string): string | null {
  const parts = splitPath(pathname);
  if (parts[0] !== "lt" && parts[0] !== "en") return null;
  const locale = parts[0] as Locale;
  const rest = parts.slice(1);
  if (rest.length === 0) return `/${locale}`;

  const canonical = SEGMENT_TO_CANONICAL[rest[0]];
  if (!canonical) return `/${locale}/${rest.join("/")}`;
  return `/${locale}/${[canonical, ...rest.slice(1)].join("/")}`;
}

export function publicRedirectPath(pathname: string): string | null {
  const legacy: Record<string, string> = {
    "/court-alerts": "/lt",
    "/dashboard": "/lt",
    "/tournaments": "/lt/turnyrai",
    "/about": "/lt/apie",
    "/saved": "/lt/issaugoti",
    "/play": "/lt/zaidimas",
    "/quiz": "/lt/kvizas",
  };
  if (legacy[pathname]) return legacy[pathname];

  const parts = splitPath(pathname);
  if ((parts[0] === "lt" || parts[0] === "en") && (parts[1] === "court-alerts" || parts[1] === "dashboard")) {
    return `/${parts[0]}`;
  }
  if (parts[0] !== "lt" || parts.length < 2) return null;
  const canonical = CANONICAL_SEGMENTS.find((segment) => segment === parts[1]);
  if (!canonical) return null;
  const pub = PUBLIC_SEGMENT.lt[canonical];
  if (pub === parts[1]) return null;
  return `/lt/${[pub, ...parts.slice(2)].join("/")}`;
}
