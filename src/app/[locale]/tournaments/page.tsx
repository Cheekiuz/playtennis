import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import TournamentFilters from "@/components/TournamentFilters";
import TournamentMap from "@/components/TournamentMap";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import { filtersAreIndexable, listTournaments, parseFilters } from "@/lib/tournaments/queries";

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
  const index = filtersAreIndexable(filters) && (filters.page ?? 1) === 1 && raw.view !== "map";

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
  const view = rawParams.view === "map" ? "map" : "list";
  const filters = parseFilters(rawParams);
  const result = await listTournaments(filters, view === "map" ? 200 : PAGE_SIZE);
  const page = filters.page ?? 1;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const base = localePath(locale, "/tournaments");
  const points = result.items.flatMap((tournament) =>
    tournament.latitude != null && tournament.longitude != null
      ? [{
          id: tournament.id,
          lat: tournament.latitude,
          lng: tournament.longitude,
          name: tournament.name,
          city: tournament.city,
          href: localePath(locale, `/tournaments/${tournament.slug}`),
        }]
      : [],
  );

  return (
    <SiteFrame locale={locale} messages={messages}>
      <h1 className="text-4xl font-bold tracking-tight">{messages.discover.results}</h1>
      <div className="mt-6">
        <TournamentFilters locale={locale} messages={messages} values={filters} />
      </div>
      <div className="mt-6 flex gap-3 text-sm font-semibold">
        <Link href={viewHref(base, filters, "list")} className={view === "list" ? "text-accent" : "text-foreground/70"} aria-current={view === "list" ? "page" : undefined}>
          {messages.discover.listView}
        </Link>
        <Link href={viewHref(base, filters, "map")} className={view === "map" ? "text-accent" : "text-foreground/70"} aria-current={view === "map" ? "page" : undefined}>
          {messages.discover.mapView}
        </Link>
      </div>
      <p className="mt-4 text-sm text-foreground/70">
        {result.total}{view === "list" ? ` · ${messages.discover.page} ${page}` : ""}
      </p>
      {view === "map" ? (
        <div className="mt-6">
          <TournamentMap
            points={points}
            emptyLabel={messages.discover.mapEmpty}
            note={messages.discover.mapNote}
            openLabel={messages.discover.view}
          />
        </div>
      ) : result.items.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/70">{messages.discover.empty}</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {result.items.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
          ))}
        </div>
      )}
      {view === "list" && pages > 1 ? (
        <nav className="mt-8 flex gap-4 text-sm font-semibold" aria-label={messages.discover.page}>
          {page > 1 ? (
            <Link href={pageHref(base, filters, page - 1)} rel="prev">
              {messages.discover.previous}
            </Link>
          ) : null}
          {page < pages ? (
            <Link href={pageHref(base, filters, page + 1)} rel="next">
              {messages.discover.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </SiteFrame>
  );
}

function viewHref(base: string, filters: ReturnType<typeof parseFilters>, view: "list" | "map"): string {
  const href = pageHref(base, filters, 1);
  if (view === "list") return href;
  return href.includes("?") ? `${href}&view=map` : `${href}?view=map`;
}

function pageHref(base: string, filters: ReturnType<typeof parseFilters>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === "page" || value === 1) continue;
    params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
