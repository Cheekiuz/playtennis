import PlayerFirstBand from "@/components/PlayerFirstBand";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SiteModalProvider } from "@/components/SiteModals";
import TennisBallIcon from "@/components/TennisBallIcon";
import TournamentListingDesk from "@/components/TournamentListingDesk";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { CATALOG_SECTION_PATHS } from "@/lib/tournaments/catalog";
import {
  getCatalogSectionCounts,
  listEventPlaces,
  listSectionTournaments,
  listTournaments,
} from "@/lib/tournaments/queries";
import type { CatalogSection, CatalogWhen } from "@/lib/tournaments/types";

export default async function DiscoverHome({
  locale,
  messages,
  section = "lithuania",
  when = "upcoming",
  filterValues = {},
}: {
  locale: Locale;
  messages: Messages;
  section?: CatalogSection | "all";
  when?: CatalogWhen;
  filterValues?: {
    q?: string;
    country?: string;
    city?: string;
    format?: string;
    surface?: string;
    playLevel?: string;
    age?: string;
  };
}) {
  const activeSection = section === "all" ? "lithuania" : section;
  const hasExtraFilters = Boolean(
    filterValues.q ||
      filterValues.city ||
      filterValues.format ||
      filterValues.surface ||
      filterValues.playLevel ||
      filterValues.age ||
      filterValues.country,
  );
  const [result, places, counts] = await Promise.all([
    hasExtraFilters
      ? listTournaments(
          {
            catalogSection: activeSection,
            catalogWhen: when,
            q: filterValues.q,
            country: filterValues.country,
            city: filterValues.city,
            format: filterValues.format,
            surface: filterValues.surface,
            playLevel: filterValues.playLevel,
            age: filterValues.age,
            page: 1,
          },
          12,
        )
      : listSectionTournaments(activeSection, when, 12, 1),
    listEventPlaces(locale),
    getCatalogSectionCounts(),
  ]);

  const home = messages.home;
  const basePath = localePath(locale, CATALOG_SECTION_PATHS[activeSection]);

  return (
    <SiteModalProvider>
      <div className="home-editorial public-shell relative min-h-screen overflow-x-clip bg-[#fbfbfa] text-[#111915]">
        <SiteHeader />
        <main>
          <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 lg:px-12">
            <div className="grid overflow-hidden rounded-[28px] bg-[#0d2818] text-white lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
                <div className="space-y-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8ff00]">• {home.badge}</p>
                  <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                    {home.headlineLead}{" "}
                    <span className="text-[#c8ff00]">{home.headlineMark}</span>
                  </h1>
                  <p className="max-w-lg text-base leading-7 text-white/75 sm:text-lg">{home.support}</p>
                  <a
                    href="#play-next"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c8ff00] px-6 text-sm font-bold text-[#0d2818] hover:bg-white"
                  >
                    {home.findTournament} <span aria-hidden="true">↗</span>
                  </a>
                </div>
                <p className="flex items-center gap-2 text-sm text-white/65">
                  <span aria-hidden="true">✶</span>
                  {home.quiet}
                </p>
              </div>
              <div className="relative min-h-[280px] border-t border-white/10 bg-[#123526] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="flex items-start justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                  <span>{home.heroCaption}</span>
                  <span className="tabular-nums text-[#c8ff00]">{home.heroScore}</span>
                </div>
                <div className="mt-8 flex flex-col items-center justify-center">
                  <div className="relative flex h-48 w-full max-w-sm items-center justify-center rounded-[24px] border border-white/10 bg-[#1a4d35] shadow-inner">
                    <div className="absolute inset-x-8 top-1/2 h-px bg-white/35" />
                    <div className="absolute inset-y-8 left-1/2 w-px bg-white/25" />
                    <div className="relative z-10">
                      <TennisBallIcon size={88} priority />
                    </div>
                  </div>
                  <p className="mt-6 max-w-xs text-center text-sm leading-6 text-white/70">{home.heroVisualHint}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1440px] px-4 pb-12 lg:px-12">
            <TournamentListingDesk
              locale={locale}
              messages={messages}
              section={activeSection}
              when={when}
              items={result.items}
              total={result.total}
              places={places}
              counts={counts}
              basePath={basePath}
              showRegionTabs
              filterValues={filterValues}
            />
          </section>

          <PlayerFirstBand messages={messages} />
        </main>
        <SiteFooter locale={locale} messages={messages} />
      </div>
    </SiteModalProvider>
  );
}
