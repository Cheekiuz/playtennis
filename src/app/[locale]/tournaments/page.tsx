import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import TournamentFilters from "@/components/TournamentFilters";
import TournamentMap from "@/components/TournamentMap";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import { filtersAreIndexable, listEventPlaces, listTournaments, parseFilters } from "@/lib/tournaments/queries";

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
  const [result, places] = await Promise.all([
    listTournaments(filters, view === "map" ? 200 : PAGE_SIZE),
    listEventPlaces(locale),
  ]);
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
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{messages.discover.subhead}</p>
      <p className="mt-3 text-sm text-foreground/80">
        {messages.home.submitTitle}{" "}
        <Link href={localePath(locale, "/submit")} className="font-semibold text-accent underline-offset-2 hover:underline">
          {messages.nav.submit}
        </Link>
      </p>
      <div className="mt-6">
        <TournamentFilters locale={locale} messages={messages} values={filters} places={places} />
      </div>
      <div className="mt-6 flex gap-3 text-sm font-semibold">
        <Link href={viewHref(base, filters, "list")} className={view === "list" ? "text-accent" : "text-foreground/70"} aria-current={view === "list" ? "page" : undefined}>
          {messages.discover.listView}
        </Link>
        <Link href={viewHref(base, filters, "map")} className={view === "map" ? "text-accent" : "text-foreground/70"} aria-current={view === "map" ? "page" : undefined}>
          {messages.discover.mapView}
        </Link>
      </div>
      {result.items.length > 0 ? (
        <p className="mt-4 text-sm text-foreground/70">
          {messages.discover.count.replace("{count}", String(result.total))}
          {view === "list" && pages > 1 ? ` · ${messages.discover.page} ${page}` : ""}
        </p>
      ) : null}
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
        <EventsEmpty
          locale={locale}
          messages={messages}
          kind={!result.ready ? "error" : filtersAreIndexable(filters) ? "building" : "filtered"}
        />
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

function EventsEmpty({
  locale,
  messages,
  kind,
}: {
  locale: Locale;
  messages: ReturnType<typeof getMessages>;
  kind: "filtered" | "building" | "error";
}) {
  const d = messages.discover;
  if (kind === "error") return <p className="mt-8 text-base text-foreground/80">{d.loadError}</p>;
  if (kind === "filtered") {
    return (
      <div className="mt-8 max-w-xl space-y-3">
        <h2 className="text-2xl font-bold">{d.empty}</h2>
        <p className="text-base text-foreground/80">{d.emptyBody}</p>
        <Link href={localePath(locale, "/tournaments")} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-2 hover:underline">
          {d.clear}
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-8 max-w-xl space-y-4">
      <h2 className="text-2xl font-bold">{d.buildingTitle}</h2>
      <p className="text-base leading-7 text-foreground/80">{d.buildingBody}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={localePath(locale, "/submit")} className="btn-primary inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold">
          {messages.nav.submit}
        </Link>
        <Link href={localePath(locale, "/tournaments")} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-accent underline-offset-2 hover:underline">
          {messages.quiz.browse}
        </Link>
      </div>
    </div>
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
