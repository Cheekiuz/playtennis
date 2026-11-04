import Link from "next/link";
import { MIN_INDEXABLE_PLACE_EVENTS, placeSlug } from "@/lib/discovery/places";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { regionName } from "@/lib/tournaments/countries";
import type { EventPlaces } from "@/lib/tournaments/queries";

export type PlaceLink = { href: string; label: string; count: number };

/** Crawlable links to indexable country and city landing pages (same threshold as the pages and sitemap). */
export function indexablePlaceLinks(
  places: EventPlaces,
  locale: Locale,
  options: { countryCode?: string; excludeSlug?: string } = {},
): { countries: PlaceLink[]; cities: PlaceLink[] } {
  const countries = places.countries
    .filter((country) => country.count >= MIN_INDEXABLE_PLACE_EVENTS)
    .map((country) => ({
      slug: placeSlug(regionName(country.code, "en")),
      label: country.name,
      count: country.count,
    }))
    .filter((item) => item.slug && item.slug !== options.excludeSlug)
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ href: localePath(locale, `/events/${item.slug}`), label: item.label, count: item.count }));

  const countrySlugs = new Set(places.countries.map((country) => placeSlug(regionName(country.code, "en"))));
  const cities = places.cityPlaces
    .filter((city) => city.count >= MIN_INDEXABLE_PLACE_EVENTS)
    .filter((city) => !options.countryCode || city.countryCode === options.countryCode)
    .map((city) => ({ slug: placeSlug(city.city), label: city.city, count: city.count }))
    .filter((item) => item.slug && !countrySlugs.has(item.slug) && item.slug !== options.excludeSlug)
    .map((item) => ({ href: localePath(locale, `/events/${item.slug}`), label: item.label, count: item.count }));

  return { countries, cities };
}

export default function PlaceLinks({
  title,
  links,
  messages,
  limit = 12,
}: {
  title: string;
  links: PlaceLink[];
  messages: Messages;
  limit?: number;
}) {
  const shown = links.slice(0, limit);
  if (shown.length === 0) return null;
  return (
    <nav aria-label={title}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {shown.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-[#e7e7e2] bg-white px-4 py-2 text-sm font-semibold text-[#111915] hover:border-[#111915]"
            >
              {link.label}
              <span className="text-xs font-medium text-[#747874]">{messages.seo.eventsCount.replace("{count}", String(link.count))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
