import HomeHero from "@/components/HomeHero";
import PlayerFirstBand from "@/components/PlayerFirstBand";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SiteModalProvider } from "@/components/SiteModals";
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

  const basePath = localePath(locale, CATALOG_SECTION_PATHS[activeSection]);

  return (
    <SiteModalProvider>
      <div className="home-editorial public-shell relative min-h-screen overflow-x-clip bg-[#fbfbfa] text-[#111915]">
        <SiteHeader />
        <main>
          <HomeHero messages={messages} />

          <section className="mx-auto w-full max-w-[1440px] px-4 pb-12 lg:px-12">
            <TournamentListingDesk
              key={`${activeSection}-${when}`}
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
