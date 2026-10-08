import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import { countrySlug, MIN_INDEXABLE_PLACE_EVENTS } from "@/lib/discovery/places";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import { regionName } from "@/lib/tournaments/countries";
import { listEventPlaces, listTournaments } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; place: string }>;
}): Promise<Metadata> {
  const { locale, place } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await loadCountryPage(locale, place);
  if (!page) return { robots: { index: false, follow: false } };

  const messages = getMessages(locale);
  const path = localePath(locale, `/events/${place}`);
  return {
    title: `${messages.discover.placeTitle.replace("{place}", page.country.name)} | PlayTennis.lt`,
    description: messages.discover.placeDescription.replace("{place}", page.country.name),
    alternates: {
      canonical: absoluteUrl(path),
      languages: routeAlternates(`/events/${place}`),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CountryEventsPage({
  params,
}: {
  params: Promise<{ locale: string; place: string }>;
}) {
  const { locale: raw, place } = await params;
  if (!isValidLocale(raw)) return null;
  const locale: Locale = raw;
  const page = await loadCountryPage(locale, place);
  if (!page) notFound();

  const messages = getMessages(locale);
  const d = messages.discover;
  const listHref = `${localePath(locale, "/tournaments")}?country=${page.country.code}`;

  return (
    <SiteFrame locale={locale} messages={messages}>
      <p className="text-sm text-foreground/70">
        <Link href={localePath(locale, "/tournaments")} className="hover:text-foreground">
          {messages.nav.tournaments}
        </Link>
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{d.placeTitle.replace("{place}", page.country.name)}</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{d.placeDescription.replace("{place}", page.country.name)}</p>
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
        {page.result.items.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
        ))}
      </div>
    </SiteFrame>
  );
}

async function loadCountryPage(locale: Locale, slug: string) {
  const places = await listEventPlaces(locale);
  const country = places.countries.find((item) => countrySlug(regionName(item.code, "en")) === slug);
  if (!country) return null;
  const result = await listTournaments({ country: country.code, page: 1 }, 24);
  if (result.total < MIN_INDEXABLE_PLACE_EVENTS) return null;
  return { country, result };
}
