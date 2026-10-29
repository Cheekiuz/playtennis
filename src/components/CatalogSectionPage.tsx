import SiteFrame from "@/components/SiteFrame";
import TournamentListingDesk from "@/components/TournamentListingDesk";
import { CATALOG_SECTION_PATHS } from "@/lib/tournaments/catalog";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import {
  getCatalogSectionCounts,
  listEventPlaces,
  listSectionTournaments,
  listTournaments,
} from "@/lib/tournaments/queries";
import type { CatalogSection, CatalogWhen } from "@/lib/tournaments/types";

export default async function CatalogSectionPage({
  locale,
  messages,
  section,
  when,
  page,
  filterValues = {},
}: {
  locale: Locale;
  messages: Messages;
  section: CatalogSection;
  when: CatalogWhen;
  page: number;
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
            catalogSection: section,
            catalogWhen: when,
            q: filterValues.q,
            country: filterValues.country,
            city: filterValues.city,
            format: filterValues.format,
            surface: filterValues.surface,
            playLevel: filterValues.playLevel,
            age: filterValues.age,
            page,
          },
          24,
        )
      : listSectionTournaments(section, when, 24, page),
    listEventPlaces(locale),
    getCatalogSectionCounts(),
  ]);

  const base = localePath(locale, CATALOG_SECTION_PATHS[section]);
  const copy = messages.catalog[section];

  return (
    <SiteFrame locale={locale} messages={messages} wide>
      <div className="pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#111915] sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747874] sm:text-base">{copy.description}</p>
        <div className="mt-8">
          <TournamentListingDesk
            locale={locale}
            messages={messages}
            section={section}
            when={when}
            items={result.items}
            total={result.total}
            places={places}
            counts={counts}
            basePath={base}
            showRegionTabs
            filterValues={filterValues}
          />
        </div>
      </div>
    </SiteFrame>
  );
}
