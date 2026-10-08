import type { MetadataRoute } from "next";
import { countrySlug, MIN_INDEXABLE_PLACE_EVENTS } from "@/lib/discovery/places";
import { localePath, locales } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import { regionName } from "@/lib/tournaments/countries";
import { listEventPlaces, listSitemapTournaments } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["/", "/tournaments", "/about", "/play", "/quiz", "/submit"];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, path)),
        changeFrequency: path === "/tournaments" ? "daily" : "weekly",
        priority: path === "/" ? 1 : 0.7,
      });
    }
  }

  const tournaments = await listSitemapTournaments();
  for (const tournament of tournaments) {
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, `/tournaments/${tournament.slug}`)),
        lastModified: new Date(tournament.updatedAt),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  const places = await listEventPlaces("en");
  for (const country of places.countries) {
    if (country.count < MIN_INDEXABLE_PLACE_EVENTS) continue;
    const slug = countrySlug(regionName(country.code, "en"));
    if (!slug) continue;
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, `/events/${slug}`)),
        changeFrequency: "daily",
        priority: 0.5,
      });
    }
  }

  return entries;
}
