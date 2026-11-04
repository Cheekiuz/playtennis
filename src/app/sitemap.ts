import type { MetadataRoute } from "next";
import { MIN_INDEXABLE_PLACE_EVENTS, placeSlug } from "@/lib/discovery/places";
import { defaultLocale, localePath, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import { regionName } from "@/lib/tournaments/countries";
import { listEventPlaces, listSitemapTournaments } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/** One sitemap entry per locale, each carrying the full hreflang set (including x-default). */
function localized(
  path: string,
  extra: Pick<Entry, "changeFrequency" | "priority" | "lastModified">,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = absoluteUrl(localePath(locale, path));
  languages["x-default"] = absoluteUrl(localePath(defaultLocale as Locale, path));

  return locales.map((locale) => ({
    url: absoluteUrl(localePath(locale, path)),
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, places] = await Promise.all([listSitemapTournaments(), listEventPlaces("en")]);

  // Hubs change whenever any listed tournament changes; static pages carry no date rather than a fake one.
  const latestUpdate = tournaments.reduce<Date | undefined>((latest, tournament) => {
    const updated = new Date(tournament.updatedAt);
    if (Number.isNaN(updated.getTime())) return latest;
    return !latest || updated > latest ? updated : latest;
  }, undefined);

  const entries: MetadataRoute.Sitemap = [
    ...localized("/", { changeFrequency: "daily", priority: 1, lastModified: latestUpdate }),
    ...localized("/tournaments", { changeFrequency: "daily", priority: 0.9, lastModified: latestUpdate }),
    ...["/lithuania", "/baltics", "/itf"].flatMap((path) =>
      localized(path, { changeFrequency: "daily", priority: 0.8, lastModified: latestUpdate }),
    ),
    ...["/about", "/play", "/quiz", "/submit"].flatMap((path) =>
      localized(path, { changeFrequency: "monthly", priority: 0.5, lastModified: undefined }),
    ),
  ];

  for (const country of places.countries) {
    if (country.count < MIN_INDEXABLE_PLACE_EVENTS) continue;
    const slug = placeSlug(regionName(country.code, "en"));
    if (!slug) continue;
    entries.push(...localized(`/events/${slug}`, { changeFrequency: "daily", priority: 0.7, lastModified: latestUpdate }));
  }

  const countrySlugs = new Set(places.countries.map((country) => placeSlug(regionName(country.code, "en"))));
  const seenCities = new Set<string>();
  for (const city of places.cityPlaces) {
    if (city.count < MIN_INDEXABLE_PLACE_EVENTS) continue;
    const slug = placeSlug(city.city);
    if (!slug || countrySlugs.has(slug) || seenCities.has(slug)) continue;
    seenCities.add(slug);
    entries.push(...localized(`/events/${slug}`, { changeFrequency: "daily", priority: 0.7, lastModified: latestUpdate }));
  }

  for (const tournament of tournaments) {
    entries.push(
      ...localized(`/tournaments/${tournament.slug}`, {
        changeFrequency: "weekly",
        priority: 0.6,
        lastModified: new Date(tournament.updatedAt),
      }),
    );
  }

  return entries;
}
