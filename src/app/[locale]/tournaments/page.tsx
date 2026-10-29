import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import TournamentListingDesk from "@/components/TournamentListingDesk";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import {
  filtersAreIndexable,
  getCatalogSectionCounts,
  listEventPlaces,
  listTournaments,
  parseFilters,
} from "@/lib/tournaments/queries";
import type { CatalogWhen } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = getMessages(locale);
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const path = localePath(locale, "/tournaments");
  const index = filtersAreIndexable(filters) && (filters.page ?? 1) === 1;

  return {
    title: `${messages.discover.listingMetaTitle} | PlayTennis.lt`,
    description: messages.discover.listingMetaDescription,
    alternates: {
      canonical: absoluteUrl(path),
      languages: routeAlternates("/tournaments"),
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function TournamentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) return null;
  const locale: Locale = raw;
  const messages = getMessages(locale);
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const when: CatalogWhen = one(rawParams.when) === "past" ? "past" : "upcoming";
  const [result, places, counts] = await Promise.all([
    listTournaments(
      {
        ...filters,
        catalogWhen: when,
        when: undefined,
      },
      PAGE_SIZE,
    ),
    listEventPlaces(locale),
    getCatalogSectionCounts(),
  ]);
  const base = localePath(locale, "/tournaments");

  return (
    <SiteFrame locale={locale} messages={messages} wide>
      <div className="pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#111915] sm:text-4xl">{messages.discover.results}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747874] sm:text-base">{messages.discover.subhead}</p>
        <p className="mt-3 text-sm text-[#747874]">
          {messages.home.submitTitle}{" "}
          <Link href={localePath(locale, "/submit")} className="font-semibold text-[#111915] underline-offset-2 hover:underline">
            {messages.nav.submit}
          </Link>
        </p>
        <div className="mt-8">
          <TournamentListingDesk
            key={`all-${when}`}
            locale={locale}
            messages={messages}
            section="all"
            when={when}
            items={result.items}
            total={result.total}
            places={places}
            counts={counts}
            basePath={base}
            showRegionTabs
            filterValues={{
              q: filters.q,
              country: filters.country,
              city: filters.city,
              format: filters.format,
              surface: filters.surface,
              playLevel: filters.playLevel,
              age: filters.age,
            }}
          />
        </div>
      </div>
    </SiteFrame>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
