import FaqSection from "@/components/FaqSection";
import HomeHero from "@/components/HomeHero";
import ListingJsonLd, { latestUpdate } from "@/components/ListingJsonLd";
import PlaceLinks, { indexablePlaceLinks } from "@/components/PlaceLinks";
import PlayerFirstBand from "@/components/PlayerFirstBand";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SiteModalProvider } from "@/components/SiteModals";
import TournamentListingDesk from "@/components/TournamentListingDesk";
import type { Locale, Messages } from "@/lib/i18n";
import { buildHeroPool } from "@/lib/tournaments/hero-pick";
import { localePath } from "@/lib/i18n";
import { CATALOG_SECTION_PATHS } from "@/lib/tournaments/catalog";
import { siteFaq } from "@/lib/tournaments/place-copy";
import { formatDay } from "@/lib/tournaments/present";
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
  const [result, places, counts, lithuaniaPool, balticsPool, itfPool] = await Promise.all([
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
    listSectionTournaments("lithuania", "upcoming", 200, 1),
    listSectionTournaments("baltics", "upcoming", 200, 1),
    listSectionTournaments("itf", "upcoming", 200, 1),
  ]);

  const basePath = localePath(locale, CATALOG_SECTION_PATHS[activeSection]);
  const heroPool = buildHeroPool(
    [lithuaniaPool.items, balticsPool.items, itfPool.items],
    locale,
    new Date().toISOString().slice(0, 10),
  );

  const indexableHome = !hasExtraFilters && when === "upcoming" && activeSection === "lithuania";
  const faq = siteFaq(messages);
  const placeLinks = indexablePlaceLinks(places, locale);
  const lastUpdated = latestUpdate(result.items)?.slice(0, 10) ?? null;

  return (
    <SiteModalProvider>
      {indexableHome ? (
        <ListingJsonLd
          locale={locale}
          path="/"
          name={messages.meta.title}
          description={messages.meta.description}
          items={result.items}
          crumbs={[{ name: messages.meta.siteName, path: "/" }]}
          faq={faq}
        />
      ) : null}
      <div className="home-editorial public-shell relative min-h-screen overflow-x-clip">
        <SiteHeader />
        <main>
          <HomeHero messages={messages} heroPool={heroPool} />

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

          <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 lg:px-12" aria-labelledby="home-about">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div>
                <h2 id="home-about" className="text-2xl font-bold tracking-tight">
                  {messages.seo.howWeVerifyTitle}
                </h2>
                <p className="mt-3 text-base leading-7 text-[#434845]">{messages.seo.howWeVerifyBody}</p>
                {lastUpdated ? (
                  <p className="mt-3 text-xs text-[#747874]">
                    {messages.seo.lastUpdated}: <time dateTime={lastUpdated}>{formatDay(lastUpdated, locale)}</time>
                  </p>
                ) : null}
                <div className="mt-8">
                  <PlaceLinks
                    title={messages.seo.popularPlaces}
                    links={[...placeLinks.countries, ...placeLinks.cities]}
                    messages={messages}
                  />
                </div>
              </div>
              <FaqSection title={messages.faq.title} items={faq} />
            </div>
          </section>
        </main>
        <SiteFooter locale={locale} messages={messages} />
      </div>
    </SiteModalProvider>
  );
}
