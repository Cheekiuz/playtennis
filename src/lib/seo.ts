import type { Metadata } from "next";
import { defaultLocale, getMessages, localePath, locales, type Locale } from "@/lib/i18n";

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

export function routeAlternates(pathname: string): Record<string, string> {
  return {
    lt: absoluteUrl(localePath("lt", pathname)),
    en: absoluteUrl(localePath("en", pathname)),
    "x-default": absoluteUrl(localePath(defaultLocale, pathname)),
  };
}

export const SITE_NAME = "PlayTennis.lt";

const ROBOTS_INDEX: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** Site-wide defaults inherited by every route. Page-specific fields come from `buildMetadata`. */
export function buildRootMetadata(locale: Locale): Metadata {
  const m = getMessages(locale);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: m.meta.title, template: `%s | ${SITE_NAME}` },
    description: m.meta.description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "sports",
    formatDetection: { telephone: false, email: false, address: false },
    robots: ROBOTS_INDEX,
  };
}

export type BuildMetadataInput = {
  locale: Locale;
  /** Internal (canonical segment) path such as "/tournaments" or "/" for home. */
  path: string;
  title: string;
  description: string;
  keywords?: string;
  /** Use the title exactly as given, without the "| PlayTennis.lt" suffix. */
  absoluteTitle?: boolean;
  /** Keep out of the index (still followed unless `follow` is false). */
  noindex?: boolean;
  follow?: boolean;
  /** Canonical internal path when it differs from `path` (for filtered views). */
  canonicalPath?: string;
  type?: "website" | "article";
  /** Internal path of the social image route. Defaults to the locale brand image. */
  imagePath?: string;
  other?: Record<string, string | number | (string | number)[]>;
};

/** One consistent page metadata builder: canonical, hreflang, Open Graph, Twitter and robots. */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { locale, path, title, description, keywords, noindex = false, follow = true, type = "website" } = input;
  const m = getMessages(locale);
  const canonical = absoluteUrl(localePath(locale, input.canonicalPath ?? path));
  const url = absoluteUrl(localePath(locale, path));
  const fullTitle = input.absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  // Pages that define openGraph/twitter replace the file-convention images from parent segments, so set them here.
  const image = absoluteUrl(localePath(locale, input.imagePath ?? "/opengraph-image"));
  const imageAlt = m.meta.ogImageAlt;

  return {
    title: input.absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical,
      languages: path === "/" ? languageAlternates() : routeAlternates(path),
    },
    openGraph: {
      type,
      locale: locale === "lt" ? "lt_LT" : "en_US",
      alternateLocale: locale === "lt" ? ["en_US"] : ["lt_LT"],
      url: noindex ? canonical : url,
      siteName: m.meta.siteName,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
    robots: noindex
      ? { index: false, follow }
      : ROBOTS_INDEX,
    ...(input.other ? { other: input.other } : {}),
  };
}

/** Home page metadata. */
export function buildPageMetadata(locale: Locale, options: { noindex?: boolean } = {}): Metadata {
  const m = getMessages(locale);
  return buildMetadata({
    locale,
    path: "/",
    title: m.meta.title,
    description: m.meta.description,
    keywords: m.meta.keywords,
    absoluteTitle: true,
    noindex: options.noindex,
  });
}

const TRACKING_PARAMS = /^(utm_|gclid|fbclid|msclkid|ref$|source$)/i;

/**
 * True when the URL carries state that should keep the view out of the index
 * (filters, search, past events, pages beyond the first). Tracking params and `page=1` are ignored.
 */
export function hasIndexBlockingParams(query: Record<string, string | string[] | undefined>): boolean {
  return Object.entries(query).some(([key, value]) => {
    if (TRACKING_PARAMS.test(key)) return false;
    const first = Array.isArray(value) ? value[0] : value;
    if (first === undefined || first === "") return false;
    if (key === "page" && first === "1") return false;
    return true;
  });
}

/**
 * Trims text to a snippet-friendly length. Prefers dropping whole trailing sentences, then falls back to a word cut.
 * Single-letter abbreviations ("m.", "d." in Lithuanian dates) are not treated as sentence ends.
 */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").replace(/\.{2,}/g, ".").trim();
  if (clean.length <= max) return clean;

  let sentenceEnd = -1;
  for (const match of clean.matchAll(/\.\s/g)) {
    const index = match.index ?? 0;
    if (index + 1 > max) break;
    const abbreviation = /\p{L}/u.test(clean[index - 1] ?? "") && (index === 1 || clean[index - 2] === " ");
    if (!abbreviation) sentenceEnd = index + 1;
  }
  if (sentenceEnd > max * 0.5) return clean.slice(0, sentenceEnd);

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s]+$/, "")}.`;
}
