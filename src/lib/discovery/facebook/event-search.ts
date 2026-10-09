import { facebookAccessToken } from "@/lib/discovery/facebook/graph-events";
import { mapGraphEvent } from "@/lib/discovery/facebook/graph-events";
import { fetchPublicFacebookEventFromUrl } from "@/lib/discovery/facebook/public-event-page";
import { politeFetch, sleep } from "@/lib/discovery/http";
import { shouldExcludeTableTennis } from "@/lib/discovery/tennis-sport";
import type { RawObservation } from "@/lib/discovery/types";
import type { RegistrySource } from "@/lib/discovery/registry-types";

/** Lawn-tennis oriented queries (table tennis filtered separately). */
export const DEFAULT_FACEBOOK_EVENT_SEARCH_QUERIES = [
  "teniso turnyras",
  "teniso",
  "lauko tenis",
  "tennis tournament",
  "tennis turnyras",
] as const;

const DEFAULT_SEARCH_URL = "https://www.facebook.com/events/search?q=teniso";

type GraphSearchEvent = {
  id: string;
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  place?: { name?: string; location?: { city?: string; country?: string } };
  ticket_uri?: string;
};

export function facebookEventSearchEnabled(source: RegistrySource): boolean {
  const meta = source.metadata;
  if (meta.enableFacebookEventSearch === true) return true;
  if (Array.isArray(meta.facebookEventSearchQueries) && meta.facebookEventSearchQueries.length > 0) return true;
  if (Array.isArray(meta.facebookEventSearchUrls) && meta.facebookEventSearchUrls.length > 0) return true;
  return source.registrySourceType === "FACEBOOK_EVENT" && source.url.includes("/events/search");
}

export function facebookEventSearchConfig(source: RegistrySource): {
  queries: string[];
  searchUrls: string[];
} {
  const meta = source.metadata;
  const queries = Array.isArray(meta.facebookEventSearchQueries)
    ? meta.facebookEventSearchQueries.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const searchUrls = Array.isArray(meta.facebookEventSearchUrls)
    ? meta.facebookEventSearchUrls.filter((item): item is string => typeof item === "string" && item.includes("facebook.com"))
    : [];
  const defaultQueries = [...DEFAULT_FACEBOOK_EVENT_SEARCH_QUERIES];
  if (searchUrls.length === 0 && queries.length === 0 && source.url.includes("/events/search")) {
    return {
      queries: defaultQueries,
      searchUrls: defaultQueries.map((query) => facebookEventSearchUrl(query)),
    };
  }
  if (searchUrls.length === 0 && queries.length > 0) {
    return {
      queries,
      searchUrls: queries.map((query) => facebookEventSearchUrl(query)),
    };
  }
  const resolvedQueries = queries.length > 0 ? queries : defaultQueries;
  return {
    queries: resolvedQueries,
    searchUrls: searchUrls.length > 0 ? searchUrls : resolvedQueries.map((query) => facebookEventSearchUrl(query)),
  };
}

export function facebookEventSearchUrl(query: string): string {
  return `https://www.facebook.com/events/search?q=${encodeURIComponent(query)}`;
}

export async function fetchFacebookEventSearch(
  source: RegistrySource,
): Promise<{ observations: RawObservation[]; errors: string[] }> {
  const { queries, searchUrls } = facebookEventSearchConfig(source);
  const observations: RawObservation[] = [];
  const errors: string[] = [];
  const seenUrls = new Set<string>();

  const push = (row: RawObservation | null) => {
    if (!row || shouldExcludeTableTennis(row)) return;
    if (seenUrls.has(row.sourceUrl)) return;
    seenUrls.add(row.sourceUrl);
    observations.push(row);
  };

  for (const query of queries) {
    const graphRows = await searchEventsViaGraph(source, query);
    if (graphRows.error) errors.push(graphRows.error);
    for (const row of graphRows.events) push(row);
  }

  for (const searchUrl of searchUrls) {
    const htmlResult = await searchEventsViaPublicHtml(source, searchUrl);
    if (htmlResult.error) errors.push(htmlResult.error);
    for (const row of htmlResult.events) push(row);
  }

  if (observations.length === 0 && errors.length === 0 && !facebookAccessToken()) {
    errors.push(
      "Facebook event search returned no public HTML results (login wall). Add FACEBOOK_ACCESS_TOKEN or list event URLs in source metadata.",
    );
  }

  return { observations, errors };
}

async function searchEventsViaGraph(
  source: RegistrySource,
  query: string,
): Promise<{ events: RawObservation[]; error: string | null }> {
  const token = facebookAccessToken();
  if (!token) return { events: [], error: null };

  const meta = source.metadata;
  const limit = typeof meta.searchLimit === "number" ? meta.searchLimit : 50;
  const maxPages = typeof meta.searchMaxPages === "number" ? meta.searchMaxPages : 3;
  const useGeo = meta.searchUseGeo === true;
  const lat = typeof meta.searchLat === "number" ? meta.searchLat : null;
  const lng = typeof meta.searchLng === "number" ? meta.searchLng : null;
  const distance = typeof meta.searchDistanceM === "number" ? meta.searchDistanceM : null;

  let nextUrl: string | null = buildGraphSearchUrl(token, query, limit, useGeo, lat, lng, distance);
  const events: RawObservation[] = [];
  let lastError: string | null = null;

  for (let page = 0; page < maxPages && nextUrl; page += 1) {
    const response = await politeFetch(nextUrl, { headers: { Accept: "application/json" } });
    const json = (await response.json()) as {
      data?: GraphSearchEvent[];
      paging?: { next?: string };
      error?: { message?: string };
    };
    if (!response.ok) {
      lastError = json.error?.message ?? `Facebook Graph event search failed (${response.status}).`;
      break;
    }

    for (const row of json.data ?? []) {
      const mapped = mapGraphEvent(source, row);
      if (mapped && isPlausiblyLawnTennisEvent(mapped)) events.push(mapped);
    }

    nextUrl = json.paging?.next ?? null;
    if (nextUrl) await sleep(300);
  }

  return { events, error: lastError };
}

function buildGraphSearchUrl(
  token: string,
  query: string,
  limit: number,
  useGeo: boolean,
  lat: number | null,
  lng: number | null,
  distance: number | null,
): string {
  const url = new URL("https://graph.facebook.com/v21.0/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "event");
  url.searchParams.set("fields", "id,name,description,start_time,end_time,place,ticket_uri");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);
  if (useGeo && lat != null && lng != null && distance != null) {
    url.searchParams.set("center", `${lat},${lng}`);
    url.searchParams.set("distance", String(distance));
  }
  return url.toString();
}

function isPlausiblyLawnTennisEvent(row: RawObservation): boolean {
  const blob = [row.title, row.description, row.venue, row.city].filter(Boolean).join(" ");
  if (shouldExcludeTableTennis(row)) return false;
  return /\btenis|tennis|turnyr|tournament|čempion|championship|kort|court|🎾/i.test(blob);
}

async function searchEventsViaPublicHtml(
  source: RegistrySource,
  searchUrl: string,
): Promise<{ events: RawObservation[]; error: string | null }> {
  const response = await politeFetch(searchUrl, { headers: { Accept: "text/html" } });
  if (!response.ok) {
    return { events: [], error: `Facebook event search page failed (${response.status}): ${searchUrl}` };
  }

  const html = await response.text();
  const eventUrls = extractEventUrlsFromSearchHtml(html);
  if (eventUrls.length === 0) {
    return { events: [], error: null };
  }

  const events: RawObservation[] = [];
  for (const eventUrl of eventUrls.slice(0, 20)) {
    const parsed = await fetchPublicFacebookEventFromUrl(source, eventUrl);
    if (parsed) events.push(parsed);
  }
  return { events, error: null };
}

export function extractEventUrlsFromSearchHtml(html: string): string[] {
  const ids = new Set<string>();
  const patterns = [
    /\/events\/(\d{10,})/g,
    /\\\/events\\\/(\d{10,})/g,
    /\\u002Fevents\\u002F(\d{10,})/g,
    /"event_id"\s*:\s*"(\d{10,})"/g,
    /"eventID"\s*:\s*"(\d{10,})"/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const id = match[1];
      if (id) ids.add(id);
    }
  }

  return [...ids].map((id) => `https://www.facebook.com/events/${id}`);
}
