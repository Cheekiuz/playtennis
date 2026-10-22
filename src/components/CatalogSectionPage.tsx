import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import { CATALOG_SECTION_PATHS } from "@/lib/tournaments/catalog";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { listSectionTournaments } from "@/lib/tournaments/queries";
import type { CatalogSection, CatalogWhen } from "@/lib/tournaments/types";

const PAGE_SIZE = 24;

export default async function CatalogSectionPage({
  locale,
  messages,
  section,
  when,
  page,
}: {
  locale: Locale;
  messages: Messages;
  section: CatalogSection;
  when: CatalogWhen;
  page: number;
}) {
  const copy = messages.catalog[section];
  const result = await listSectionTournaments(section, when, PAGE_SIZE, page);
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const base = localePath(locale, CATALOG_SECTION_PATHS[section]);
  const sections = messages.catalog.sections;

  return (
    <SiteFrame locale={locale} messages={messages}>
      <nav className="flex flex-wrap gap-3 text-sm font-semibold" aria-label={messages.catalog.sectionsNav}>
        {(
          [
            ["lithuania", sections.lithuania],
            ["baltics", sections.baltics],
            ["itf", sections.itf],
          ] as const
        ).map(([key, label]) => {
          const href = localePath(locale, CATALOG_SECTION_PATHS[key]);
          const active = key === section;
          return (
            <Link
              key={key}
              href={href}
              className={active ? "text-accent underline decoration-4 underline-offset-4" : "text-foreground/70 hover:text-foreground"}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{copy.description}</p>

      <div className="mt-6 flex gap-4 text-sm font-semibold">
        <Link
          href={whenHref(base, "upcoming")}
          className={when === "upcoming" ? "text-accent" : "text-foreground/70"}
          aria-current={when === "upcoming" ? "page" : undefined}
        >
          {messages.catalog.upcoming}
        </Link>
        <Link
          href={whenHref(base, "past")}
          className={when === "past" ? "text-accent" : "text-foreground/70"}
          aria-current={when === "past" ? "page" : undefined}
        >
          {messages.catalog.past}
        </Link>
      </div>

      {result.items.length > 0 ? (
        <p className="mt-4 text-sm text-foreground/70">
          {messages.discover.count.replace("{count}", String(result.total))}
          {pages > 1 ? ` · ${messages.discover.page} ${page}` : ""}
        </p>
      ) : null}

      {result.items.length === 0 ? (
        <p className="mt-8 max-w-xl text-base text-foreground/80">
          {!result.ready ? messages.discover.loadError : when === "past" ? messages.catalog.emptyPast : messages.catalog.emptyUpcoming}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {result.items.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-8 flex gap-4 text-sm font-semibold" aria-label={messages.discover.page}>
          {page > 1 ? (
            <Link href={pageHref(base, when, page - 1)} rel="prev">
              {messages.discover.previous}
            </Link>
          ) : null}
          {page < pages ? (
            <Link href={pageHref(base, when, page + 1)} rel="next">
              {messages.discover.next}
            </Link>
          ) : null}
        </nav>
      ) : null}

      <p className="mt-10 text-xs text-foreground/60">{copy.sourceNote}</p>
    </SiteFrame>
  );
}

function whenHref(base: string, when: CatalogWhen): string {
  return when === "upcoming" ? base : `${base}?when=past`;
}

function pageHref(base: string, when: CatalogWhen, page: number): string {
  const params = new URLSearchParams();
  if (when === "past") params.set("when", "past");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
