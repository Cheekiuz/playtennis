"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSiteModals } from "@/components/SiteModals";
import TournamentCard from "@/components/TournamentCard";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { CATALOG_SECTION_PATHS } from "@/lib/tournaments/catalog";
import type { CatalogSectionCounts, EventPlaces } from "@/lib/tournaments/queries";
import { readSavedIds } from "@/lib/tournaments/saved";
import type { CatalogSection, CatalogWhen, TournamentRecord } from "@/lib/tournaments/types";

type DeskTab = CatalogWhen | "saved";
type DeskSort = "soonest" | "latest";
type DeskView = "grid" | "list";

export type DeskFilterValues = {
  q?: string;
  country?: string;
  city?: string;
  format?: string;
  surface?: string;
  playLevel?: string;
  age?: string;
  month?: string;
};

export default function TournamentListingDesk({
  locale,
  messages,
  section,
  when,
  items,
  total,
  places,
  counts,
  basePath,
  showRegionTabs = true,
  filterValues = {},
}: {
  locale: Locale;
  messages: Messages;
  section: CatalogSection | "all";
  when: CatalogWhen;
  items: TournamentRecord[];
  total: number;
  places: EventPlaces;
  counts: CatalogSectionCounts;
  basePath: string;
  showRegionTabs?: boolean;
  filterValues?: DeskFilterValues;
}) {
  const router = useRouter();
  const modals = useSiteModals();
  const desk = messages.desk;
  const [tab, setTab] = useState<DeskTab>(when);
  const [view, setView] = useState<DeskView>("grid");
  const [sort, setSort] = useState<DeskSort>("soonest");
  const [savedCount, setSavedCount] = useState(0);
  const [savedItems, setSavedItems] = useState<TournamentRecord[] | null>(null);
  const [savedLoading, startSavedTransition] = useTransition();

  useEffect(() => {
    setTab(when);
  }, [when]);

  useEffect(() => {
    const sync = () => setSavedCount(readSavedIds().length);
    sync();
    window.addEventListener("playtennis-saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("playtennis-saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const visibleItems = useMemo(() => {
    const source = tab === "saved" ? savedItems ?? [] : items;
    const sorted = [...source].sort((a, b) =>
      sort === "latest" ? b.startsOn.localeCompare(a.startsOn) : a.startsOn.localeCompare(b.startsOn),
    );
    return sorted;
  }, [items, savedItems, sort, tab]);

  function loadSaved() {
    startSavedTransition(async () => {
      const ids = readSavedIds();
      if (ids.length === 0) {
        setSavedItems([]);
        return;
      }
      const response = await fetch(`/api/tournaments?ids=${ids.map(encodeURIComponent).join(",")}`);
      if (!response.ok) {
        setSavedItems([]);
        return;
      }
      const data = (await response.json()) as { tournaments?: TournamentRecord[] };
      setSavedItems(data.tournaments ?? []);
    });
  }

  function selectTab(next: DeskTab) {
    setTab(next);
    if (next === "saved") {
      loadSaved();
      return;
    }
    const href = withParams(basePath, { when: next === "upcoming" ? undefined : next, ...filterValues });
    router.push(href);
  }

  const resetHref = section === "all" ? localePath(locale, "/tournaments") : localePath(locale, CATALOG_SECTION_PATHS[section]);

  return (
    <div id="play-next" className="scroll-mt-24">
      {showRegionTabs ? (
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#747874]">{desk.findSavePlay}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111915] sm:text-4xl">{desk.whereTitle}</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#747874] lg:text-right">{desk.whereSupport}</p>
        </div>
      ) : null}

      {showRegionTabs ? (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e7e7e2] pb-1">
          {(
            [
              ["lithuania", messages.catalog.sections.lithuania, counts.lithuania],
              ["baltics", messages.catalog.sections.baltics, counts.baltics],
              ["itf", messages.catalog.sections.itf, counts.itf],
            ] as const
          ).map(([key, label, count]) => {
            const href = localePath(locale, CATALOG_SECTION_PATHS[key]);
            const active = section === key;
            return (
              <Link
                key={key}
                href={href}
                className={
                  active
                    ? "-mb-px border-b-2 border-[#111915] px-3 py-2 text-sm font-bold text-[#111915]"
                    : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-[#747874] hover:text-[#111915]"
                }
              >
                {label}
                <span className="ml-2 rounded-full bg-[#eeeeed] px-2 py-0.5 text-[11px] font-bold tabular-nums">{count}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#e7e7e2] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111915]">{desk.filters}</h3>
            <Link href={resetHref} className="text-xs font-semibold text-[#747874] hover:text-[#111915]">
              {desk.reset}
            </Link>
          </div>
          <form method="get" action={basePath} className="space-y-3">
            {when === "past" ? <input type="hidden" name="when" value="past" /> : null}
            <label className="block text-xs font-semibold text-[#747874]">
              {desk.searchLabel}
              <input
                name="q"
                defaultValue={filterValues.q ?? ""}
                placeholder={desk.searchPlaceholder}
                className="mt-1 w-full rounded-xl border border-[#e7e7e2] bg-[#fbfbfa] px-3 py-2 text-sm text-[#111915]"
              />
            </label>
            <FilterSelect name="country" label={desk.country} defaultValue={filterValues.country} allLabel={desk.allCountries}>
              {places.countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="city" label={desk.city} defaultValue={filterValues.city} allLabel={desk.allCities}>
              {places.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="format" label={desk.format} defaultValue={filterValues.format} allLabel={desk.allFormats}>
              {Object.entries(messages.discover.formats).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="surface" label={desk.surface} defaultValue={filterValues.surface} allLabel={desk.allSurfaces}>
              {Object.entries(messages.discover.surfaces).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="playLevel" label={desk.playerLevel} defaultValue={filterValues.playLevel} allLabel={desk.allLevels}>
              {Object.entries(messages.discover.playLevels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="age" label={desk.ageGroup} defaultValue={filterValues.age} allLabel={desk.allAges}>
              {Object.entries(messages.discover.ages).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FilterSelect>
            <button type="submit" className="w-full rounded-xl bg-[#111915] px-3 py-2.5 text-sm font-bold text-[#c8ff00]">
              {messages.discover.apply}
            </button>
          </form>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-[#e7e7e2] bg-[#f3f4f3] p-1">
              {(
                [
                  ["upcoming", desk.upcoming],
                  ["past", desk.past],
                  ["saved", desk.saved],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTab(key)}
                  className={
                    tab === key
                      ? "rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#111915] shadow-sm"
                      : "rounded-full px-3 py-1.5 text-sm font-semibold text-[#747874]"
                  }
                >
                  {label}
                  {key === "saved" && savedCount > 0 ? (
                    <span className="ml-1 text-[11px] tabular-nums">{savedCount}</span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as DeskSort)}
                className="rounded-xl border border-[#e7e7e2] bg-white px-3 py-2 text-sm font-semibold text-[#111915]"
              >
                <option value="soonest">{desk.sortSoonest}</option>
                <option value="latest">{desk.sortLatest}</option>
              </select>
              <div className="inline-flex rounded-xl border border-[#e7e7e2] bg-white p-1">
                <button type="button" aria-label={desk.grid} onClick={() => setView("grid")} className={viewBtn(view === "grid")}>
                  ▦
                </button>
                <button type="button" aria-label={desk.list} onClick={() => setView("list")} className={viewBtn(view === "list")}>
                  ☰
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-[#747874]">
            {desk.count.replace("{count}", String(tab === "saved" ? visibleItems.length : total))}
          </p>

          {tab === "saved" && savedLoading ? (
            <p className="mt-8 text-sm text-[#747874]">{messages.discover.loading}</p>
          ) : visibleItems.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-[#e7e7e2] bg-white px-4 py-8 text-sm text-[#747874]">
              {tab === "saved" ? desk.emptySaved : desk.empty}
            </p>
          ) : (
            <div className={view === "grid" ? "mt-4 grid gap-4 md:grid-cols-2" : "mt-4 grid gap-3"}>
              {visibleItems.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  locale={locale}
                  messages={messages}
                  tone="paper"
                  layout={view}
                />
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-dashed border-[#c3c8c3] bg-white px-4 py-4">
            <p className="text-sm font-bold text-[#111915]">{desk.calendarTitle}</p>
            <p className="mt-1 text-sm text-[#747874]">{desk.calendarBody}</p>
            <button type="button" onClick={() => modals.open("sources")} className="mt-2 text-sm font-semibold text-[#111915] hover:underline">
              {desk.howSources} ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  allLabel,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  allLabel: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-[#747874]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-xl border border-[#e7e7e2] bg-[#fbfbfa] px-3 py-2 text-sm text-[#111915]"
      >
        <option value="">{allLabel}</option>
        {children}
      </select>
    </label>
  );
}

function viewBtn(active: boolean) {
  return active
    ? "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#111915] text-sm text-[#c8ff00]"
    : "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[#747874]";
}

function withParams(basePath: string, values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
