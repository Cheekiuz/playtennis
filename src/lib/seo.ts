import type { Metadata } from "next";
import { defaultLocale, getMessages, localePath, locales, type Locale } from "@/lib/i18n";
import { BALL_OG_IMAGE_SRC } from "@/lib/tennis-ball-assets";

const DEFAULT_SITE_URL = "https://www.playtennis.lt";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_ENV === "production") {
    const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (production) {
      return `https://${production.replace(/\/$/, "")}`;
    }
    return DEFAULT_SITE_URL;
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") {
    return base;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function languageAlternates(): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = absoluteUrl(localePath(locale));
  }
  alternates["x-default"] = absoluteUrl(localePath(defaultLocale));
  return alternates;
}

export function buildPageMetadata(locale: Locale): Metadata {
  const m = getMessages(locale);
  const path = localePath(locale);
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: m.meta.title,
    description: m.meta.description,
    keywords: m.meta.keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      locale: locale === "lt" ? "lt_LT" : "en_US",
      alternateLocale: locale === "lt" ? ["en_US"] : ["lt_LT"],
      url,
      siteName: m.meta.siteName,
      title: m.meta.title,
      description: m.meta.description,
      images: [
        {
          url: BALL_OG_IMAGE_SRC,
          width: 512,
          height: 512,
          alt: m.meta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: m.meta.title,
      description: m.meta.description,
      images: [BALL_OG_IMAGE_SRC],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildWebsiteJsonLd(locale: Locale) {
  const m = getMessages(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: m.meta.siteName,
    url: absoluteUrl(localePath(locale)),
    description: m.meta.description,
    inLanguage: locale,
  };
}
