import { inferLtCity, parseLtHeadingDates, stripHtml } from "@/lib/discovery/adapters/lt-dates";
import { politeFetch } from "@/lib/discovery/http";
import type { HttpSiteResult } from "@/lib/discovery/adapters/http-site";
import { shouldExcludeRaw } from "@/lib/discovery/adult-filter";
import { mapRegistryToSourceType, type RegistrySource } from "@/lib/discovery/registry-types";
import type { RawObservation } from "@/lib/discovery/types";

const TENNIS_PASSION_PAGE = "https://www.tennispassion.lt/wp-json/wp/v2/pages/230";
const TENNIS_PASSION_PUBLIC = "https://www.tennispassion.lt/turnyrai/#busimi-turnyrai";
const WIDEN_GAMES_API = "https://api.widenarena.lt/api/games";
const WIDEN_GAMES_PUBLIC = "https://widenarena.lt/games";
const BALZEKAS_EVENTS_API = "https://rezervacijos.balzekastennis.lt/api/events";
const BALZEKAS_PUBLIC = "https://balzekastennis.lt/renginiai";

export async function collectTennisPassionTurnyrai(source: RegistrySource): Promise<HttpSiteResult> {
  try {
    const response = await politeFetch(TENNIS_PASSION_PAGE, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return { observations: [], error: `HTTP ${response.status} for TennisPassion WP page` };
    }
    const page = (await response.json()) as { content?: { rendered?: string } };
    const html = page.content?.rendered ?? "";
    const observations = parseTennisPassionUpcoming(html, source);
    return { observations, error: observations.length === 0 ? "No upcoming tournaments found on TennisPassion turnyrai page." : null };
  } catch (error) {
    return {
      observations: [],
      error: error instanceof Error ? error.message : "TennisPassion fetch failed.",
    };
  }
}

function parseTennisPassionUpcoming(html: string, source: RegistrySource): RawObservation[] {
  const startIdx = html.indexOf('id="busimi-turnyrai"');
  const endIdx = html.search(/Pra[eė]jusi[uų]\s+teniso\s+turnyr/i);
  const slice = startIdx >= 0 ? html.slice(startIdx, endIdx >= 0 ? endIdx : undefined) : html;

  const blocks = [...slice.matchAll(/<h2[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi)];
  const observations: RawObservation[] = [];

  for (const block of blocks) {
    const headingLines = linesFromHtmlFragment(block[1]);
    const heading = headingLines.join(" ");
    if (!heading || /būsimi teniso turnyrai/i.test(heading)) continue;

    const blockStart = block.index ?? 0;
    const nextHeading = blocks.find((candidate) => (candidate.index ?? 0) > blockStart);
    const sectionHtml = slice.slice(blockStart, nextHeading?.index ?? slice.length);
    const sectionText = stripHtml(sectionHtml);

    const sharedDates =
      parseLtHeadingDates(heading) ??
      headingLines.map((line) => parseLtHeadingDates(line)).find(Boolean) ??
      parseLtHeadingDates(sectionText);

    const venueMatch = sectionHtml.match(/Vieta:[\s\S]*?elementor-icon-list-text[^>]*>([^<]{3,200})</i);
    const venue = venueMatch ? stripHtml(venueMatch[1]) : null;
    const mailMatch = sectionHtml.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    const registrationUrl = mailMatch ? `mailto:${mailMatch[1]}` : null;

    const titleCandidates = headingLines.length > 1 ? headingLines : [heading];
    for (const line of titleCandidates) {
      const dates = parseLtHeadingDates(line) ?? sharedDates;
      if (!dates) continue;
      const title = line.replace(/,\s*20\d{2}[\s\S]*$/i, "").replace(/\.\s*20\d{2}[\s\S]*$/i, "").trim();

      const city = inferLtCity(venue, source.city);
      const eventKey = encodeURIComponent(`${title || line}-${dates.startDate}`);
      const eventPage = `${TENNIS_PASSION_PUBLIC}&event=${eventKey}`;
      observations.push({
        title: title || line,
        startDate: dates.startDate,
        endDate: dates.endDate,
        countryCode: source.countryCode ?? "lt",
        city,
        venue,
        organiser: source.sourceName,
        organiserUrl: source.url,
        officialEventUrl: eventPage,
        registrationUrl,
        description: venue ? `Vieta: ${venue}` : null,
        sourceName: source.sourceName,
        sourceUrl: eventPage,
        sourceType: mapRegistryToSourceType(source.registrySourceType),
        sourceConfidence: "high",
        registrationStatus: "unknown",
      });
    }
  }

  return observations.filter((row) => !shouldExcludeRaw(row));
}

function linesFromHtmlFragment(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

type WidenGame = {
  uuid: string;
  courtType?: { name?: string };
  gameGroup?: { uuid?: string; name?: string };
  start_time?: string;
  end_time?: string;
  is_full?: boolean;
  is_joinable?: boolean;
  free_spots?: number;
  price_with_vat?: number;
  levels?: Array<{ name?: string } | string> | null;
};

const WIDEN_ARENA_ADDRESS = "Alksnynų g. 4, Vilnius";
/** OpenStreetMap Nominatim match for Widen Arena. */
const WIDEN_ARENA_LAT = 54.81287;
const WIDEN_ARENA_LNG = 25.274105;

export async function collectWidenArenaGames(source: RegistrySource): Promise<HttpSiteResult> {
  try {
    const games = await fetchAllWidenGames();
    const tennis = games.filter((row) => isLawnTennisCourt(row.courtType?.name ?? ""));
    const byGroup = new Map<string, WidenGame[]>();
    for (const game of tennis) {
      const key = game.gameGroup?.uuid ?? game.uuid;
      const list = byGroup.get(key) ?? [];
      list.push(game);
      byGroup.set(key, list);
    }

    const observations: RawObservation[] = [];
    for (const [groupKey, sessions] of byGroup) {
      const ordered = [...sessions].sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const groupName = first.gameGroup?.name?.trim() ?? "Widen Arena žaidimas";
      const starts = ordered.map((s) => s.start_time).filter(Boolean) as string[];
      if (starts.length === 0) continue;
      const startDate = starts[0].slice(0, 10);
      const endDate = starts[starts.length - 1].slice(0, 10);
      const allFull = ordered.every((s) => s.is_full);
      const anyJoinable = ordered.some((s) => s.is_joinable);
      const freeSpots = ordered.reduce((sum, s) => sum + (s.free_spots ?? 0), 0);
      const meta = parseWidenGroupMeta(groupName, startDate);
      const eventUrl = `${WIDEN_GAMES_PUBLIC}?group=${groupKey}`;
      const indoorOutdoor = /vidus|indoor/i.test(first.courtType?.name ?? "")
        ? "indoor"
        : /laukas|outdoor/i.test(first.courtType?.name ?? "")
          ? "outdoor"
          : "indoor";
      const sessionTimes = ordered
        .map((s) => {
          const start = s.start_time?.slice(11, 16);
          const end = s.end_time?.slice(11, 16);
          return start && end ? `${start}-${end}` : start;
        })
        .filter(Boolean)
        .join(", ");

      observations.push({
        title: meta.title,
        eventType: /MEET&PLAY/i.test(groupName) ? "SOCIAL" : "PLAY_SESSION",
        startDate,
        endDate,
        startTime: first.start_time?.slice(11, 16) ?? null,
        endTime: last.end_time?.slice(11, 16) ?? null,
        countryCode: source.countryCode ?? "lt",
        city: source.city ?? "Vilnius",
        venue: source.sourceName,
        address: WIDEN_ARENA_ADDRESS,
        latitude: WIDEN_ARENA_LAT,
        longitude: WIDEN_ARENA_LNG,
        indoorOutdoor,
        originalLevel: meta.level,
        gender: meta.gender,
        format: meta.format,
        organiser: source.sourceName,
        organiserUrl: source.url,
        officialEventUrl: eventUrl,
        registrationUrl: eventUrl,
        priceAmount: first.price_with_vat ?? null,
        currency: first.price_with_vat != null ? "EUR" : null,
        description: [
          `${ordered.length} court session${ordered.length === 1 ? "" : "s"} at Widen Arena.`,
          sessionTimes ? `Times: ${sessionTimes}.` : null,
          freeSpots > 0 ? `${freeSpots} free spot${freeSpots === 1 ? "" : "s"} across sessions.` : null,
        ]
          .filter(Boolean)
          .join(" "),
        sourceName: source.sourceName,
        sourceUrl: eventUrl,
        sourceExternalId: `widen-group-${groupKey}`,
        sourceType: mapRegistryToSourceType(source.registrySourceType),
        sourceConfidence: "high",
        registrationStatus: allFull ? "full" : anyJoinable ? "open" : "unknown",
        catalogSection: "lithuania",
      });
    }

    return {
      observations,
      error: observations.length === 0 ? "No lawn tennis sessions found on Widen Arena games API." : null,
    };
  } catch (error) {
    return {
      observations: [],
      error: error instanceof Error ? error.message : "Widen Arena fetch failed.",
    };
  }
}

function parseWidenGroupMeta(
  groupName: string,
  startDate: string,
): {
  title: string;
  level: string | null;
  gender: string | null;
  format: string | null;
} {
  const parts = groupName
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const body = parts.filter((part) => !/^\d{1,2}-\d{2}\s*d\.?$/i.test(part));
  const baseTitle = body.join(" · ") || groupName;
  const title = `${baseTitle} (${startDate})`;
  const blob = groupName.toLowerCase();

  let level: string | null = null;
  if (/pradedant/i.test(blob) || /\blight\b/i.test(blob)) level = "beginner";
  else if (/paženg|pazeng|intermediate|middle/i.test(blob)) level = "intermediate";
  else if (/advanced|aukšt|aukst/i.test(blob)) level = "advanced";

  let format: string | null = null;
  if (/dvejet/i.test(blob) || /doubles/i.test(blob)) format = "doubles";
  else if (/vienet/i.test(blob) || /singles/i.test(blob)) format = "singles";

  let gender: string | null = null;
  if (/\bmix\b|mišr|misr/i.test(blob)) gender = "mixed";
  else if (/moter|women|ladies/i.test(blob)) gender = "women";
  else if (/vyr|men\b|gents/i.test(blob)) gender = "men";
  else gender = "open";

  return { title, level, gender, format };
}

async function fetchAllWidenGames(): Promise<WidenGame[]> {
  const all: WidenGame[] = [];
  let page = 1;
  let lastPage = 1;
  while (page <= lastPage && page <= 20) {
    const response = await politeFetch(`${WIDEN_GAMES_API}?page=${page}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status} for Widen Arena games`);
    const body = (await response.json()) as { data?: WidenGame[]; last_page?: number };
    all.push(...(body.data ?? []));
    lastPage = body.last_page ?? 1;
    page += 1;
  }
  return all;
}

function isLawnTennisCourt(name: string): boolean {
  const folded = name.toLowerCase();
  if (/badminton|stalo|pickleball|padel|squash|beach/i.test(folded)) return false;
  return /tenis/i.test(folded);
}

type BalzekasEvent = {
  id: number;
  kind?: string;
  title?: string;
  description?: string;
  event_date?: string;
  start_date?: string | null;
  end_date?: string | null;
  price_cents?: number;
  active?: boolean;
};

export async function collectBalzekasRenginiai(source: RegistrySource): Promise<HttpSiteResult> {
  const locations = [
    { code: "vilnius", city: "Vilnius" },
    { code: "klaipeda", city: "Klaipėda" },
  ];
  const observations: RawObservation[] = [];
  const errors: string[] = [];

  for (const location of locations) {
    try {
      const response = await politeFetch(`${BALZEKAS_EVENTS_API}?location=${location.code}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        errors.push(`HTTP ${response.status} for Balzekas events (${location.code})`);
        continue;
      }
      const events = (await response.json()) as BalzekasEvent[];
      for (const event of events) {
        if (event.active === false) continue;
        const mapped = mapBalzekasEvent(event, source, location.city);
        if (mapped && !shouldExcludeRaw(mapped)) observations.push(mapped);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Balzekas ${location.code} failed`);
    }
  }

  const emptyPublicPage = await balzekasPublicPageEmpty();
  if (observations.length === 0 && emptyPublicPage && errors.length === 0) {
    return { observations: [], error: null };
  }

  return {
    observations,
    error: observations.length === 0 && errors.length > 0 ? errors.join("; ") : null,
  };
}

async function balzekasPublicPageEmpty(): Promise<boolean> {
  try {
    const response = await politeFetch(BALZEKAS_PUBLIC, { headers: { Accept: "text/html" } });
    if (!response.ok) return false;
    const html = await response.text();
    return /n[eė]ra joki[uų] rengini/i.test(html);
  } catch {
    return false;
  }
}

function mapBalzekasEvent(event: BalzekasEvent, source: RegistrySource, city: string): RawObservation | null {
  const title = event.title?.trim();
  const startDate = event.start_date?.slice(0, 10) ?? event.event_date?.slice(0, 10);
  if (!title || !startDate) return null;
  const endDate = event.end_date?.slice(0, 10) ?? startDate;
  const description = event.description ? stripHtml(event.description) : null;

  return {
    title,
    startDate,
    endDate,
    countryCode: source.countryCode ?? "lt",
    city,
    venue: source.sourceName,
    organiser: source.sourceName,
    organiserUrl: source.url,
    officialEventUrl: BALZEKAS_PUBLIC,
    registrationUrl: BALZEKAS_PUBLIC,
    priceAmount: event.price_cents != null ? event.price_cents / 100 : null,
    currency: event.price_cents != null ? "EUR" : null,
    description,
    sourceName: source.sourceName,
    sourceUrl: `${BALZEKAS_PUBLIC}#event-${event.id}`,
    sourceType: mapRegistryToSourceType(source.registrySourceType),
    sourceConfidence: "high",
    registrationStatus: "unknown",
    eventType: event.kind === "tournament" ? "TOURNAMENT" : "PLAY_SESSION",
  };
}

export type LtSiteAdapterId = "tennispassion_turnyrai" | "widenarena_games" | "balzekas_renginiai";

export function resolveLtSiteAdapter(metadata: Record<string, unknown>): LtSiteAdapterId | null {
  const adapter = metadata.adapter;
  if (adapter === "tennispassion_turnyrai" || adapter === "widenarena_games" || adapter === "balzekas_renginiai") {
    return adapter;
  }
  return null;
}

export async function collectFromLtSiteAdapter(
  adapter: LtSiteAdapterId,
  source: RegistrySource,
): Promise<HttpSiteResult> {
  switch (adapter) {
    case "tennispassion_turnyrai":
      return collectTennisPassionTurnyrai(source);
    case "widenarena_games":
      return collectWidenArenaGames(source);
    case "balzekas_renginiai":
      return collectBalzekasRenginiai(source);
  }
}
