import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FaqSection from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import PlaceLinks, { indexablePlaceLinks } from "@/components/PlaceLinks";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import { MIN_INDEXABLE_PLACE_EVENTS, placeSlug } from "@/lib/discovery/places";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbNode, collectionPageNode, faqNode, graph } from "@/lib/structured-data";
import { regionName } from "@/lib/tournaments/countries";
import { formatDay } from "@/lib/tournaments/present";
import { listEventPlaces, listTournaments } from "@/lib/tournaments/queries";
import { summarisePlace } from "@/lib/tournaments/place-copy";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; place: string }>;
}): Promise<Metadata> {
  const { locale, place } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await loadPlacePage(locale, place);
  if (!page) return { robots: { index: false, follow: false } };

  const messages = getMessages(locale);
  const summary = summarisePlace({
    place: page.name,
    total: page.total,
    items: page.items,
    locale,
    messages,
    withGeo: page.kind === "city",
  });

  return buildMetadata({
    locale,
    path: `/events/${place}`,
    title: messages.discover.placeTitle.replace("{place}", page.name),
    description: summary.metaDescription,
    other: {
      "geo.region": page.countryCode.toUpperCase(),
      "geo.placename": page.name,
      ...(summary.geo
        ? {
            "geo.position": `${summary.geo.lat.toFixed(5)};${summary.geo.lng.toFixed(5)}`,
            ICBM: `${summary.geo.lat.toFixed(5)}, ${summary.geo.lng.toFixed(5)}`,
          }
        : {}),
    },
  });
}

export default async function PlaceEventsPage({
  params,
}: {
  params: Promise<{ locale: string; place: string }>;
}) {
  const { locale: raw, place } = await params;
  if (!isValidLocale(raw)) return null;
  const locale: Locale = raw;
  const page = await loadPlacePage(locale, place);
  if (!page) notFound();

  const messages = getMessages(locale);
  const d = messages.discover;
  const summary = summarisePlace({
    place: page.name,
    total: page.total,
    items: page.items,
    locale,
    messages,
    withGeo: page.kind === "city",
  });
  const listHref =
    page.kind === "country"
      ? `${localePath(locale, "/tournaments")}?country=${page.countryCode}`
      : `${localePath(locale, "/tournaments")}?country=${page.countryCode}&city=${encodeURIComponent(page.name)}`;
  const countryName = regionName(page.countryCode, locale);
  const countrySlug = placeSlug(regionName(page.countryCode, "en"));
  const links = indexablePlaceLinks(page.places, locale, {
    countryCode: page.countryCode,
    excludeSlug: place,
  });
  const lastUpdated = summary.lastUpdated?.slice(0, 10) ?? null;
  const title = d.placeTitle.replace("{place}", page.name);
  const path = `/events/${place}`;

  const crumbs = [
    { name: messages.nav.tournaments, path: "/tournaments" },
    ...(page.kind === "city" && countrySlug ? [{ name: countryName, path: `/events/${countrySlug}` }] : []),
    { name: page.name, path },
  ];

  const jsonLd = graph(
    breadcrumbNode(crumbs, locale),
    collectionPageNode({
      locale,
      path,
      name: title,
      description: summary.metaDescription,
      dateModified: summary.lastUpdated,
      items: page.items.map((tournament) => ({
        name: tournament.name,
        url: absoluteUrl(localePath(locale, `/tournaments/${tournament.slug}`)),
      })),
    }),
    faqNode(summary.faq, locale),
  );

  return (
    <SiteFrame locale={locale} messages={messages}>
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className="text-sm text-foreground/70">
        {crumbs.slice(0, -1).map((crumb) => (
          <span key={crumb.path}>
            <Link href={localePath(locale, crumb.path)} className="hover:text-foreground">
              {crumb.name}
            </Link>
            <span className="px-2 text-foreground/40">/</span>
          </span>
        ))}
        <span aria-current="page">{page.name}</span>
      </nav>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/80">{summary.intro}</p>
      {lastUpdated ? (
        <p className="mt-2 text-xs text-foreground/60">
          {messages.seo.lastUpdated}: <time dateTime={lastUpdated}>{formatDay(lastUpdated, locale)}</time>
        </p>
      ) : null}
      <p className="mt-4 text-sm font-semibold">
        <Link href={listHref} className="underline-offset-2 hover:underline">
          {d.listView}
        </Link>
        <span className="px-2 text-foreground/40">/</span>
        <Link href={`${listHref}&view=map`} className="underline-offset-2 hover:underline">
          {d.mapView}
        </Link>
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {page.items.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
        ))}
      </div>

      {links.cities.length > 0 ? (
        <div className="mt-12">
          <PlaceLinks title={messages.seo.citiesIn.replace("{country}", countryName)} links={links.cities} messages={messages} />
        </div>
      ) : null}
      {links.countries.length > 0 ? (
        <div className="mt-10">
          <PlaceLinks title={messages.seo.otherPlaces} links={links.countries} messages={messages} />
        </div>
      ) : null}

      <FaqSection className="mt-12 max-w-3xl" title={messages.faq.title} items={summary.faq} />
    </SiteFrame>
  );
}

type PlacePage = {
  kind: "country" | "city";
  name: string;
  countryCode: string;
  items: Awaited<ReturnType<typeof listTournaments>>["items"];
  total: number;
  places: Awaited<ReturnType<typeof listEventPlaces>>;
};

/** Resolves a slug to a country page first, then to a city page. Thin places return null (404 and noindex). */
async function loadPlacePage(locale: Locale, slug: string): Promise<PlacePage | null> {
  const places = await listEventPlaces(locale);

  const country = places.countries.find((item) => placeSlug(regionName(item.code, "en")) === slug);
  if (country) {
    const result = await listTournaments({ country: country.code, page: 1 }, PAGE_SIZE);
    if (result.total < MIN_INDEXABLE_PLACE_EVENTS) return null;
    return { kind: "country", name: country.name, countryCode: country.code, items: result.items, total: result.total, places };
  }

  const city = places.cityPlaces.find((item) => placeSlug(item.city) === slug);
  if (!city) return null;
  const result = await listTournaments({ country: city.countryCode, city: city.city, page: 1 }, PAGE_SIZE);
  const exact = result.items.filter((item) => item.city.trim().toLowerCase() === city.city.toLowerCase());
  const total = result.total > PAGE_SIZE ? result.total : exact.length;
  if (total < MIN_INDEXABLE_PLACE_EVENTS) return null;
  return { kind: "city", name: city.city, countryCode: city.countryCode, items: exact, total, places };
}
