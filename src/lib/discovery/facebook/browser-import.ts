import { toCalendarDate } from "@/lib/discovery/facebook/event-date";
import { DEFAULT_FACEBOOK_PASTE_SOURCE_ID, loadRegistrySourceById } from "@/lib/discovery/facebook/manual-url-store";
import { ingestObservationsFromRegistry } from "@/lib/discovery/ingest";
import type { RawObservation } from "@/lib/discovery/types";
import { catalogSectionForCountry } from "@/lib/tournaments/catalog";

export type BrowserFacebookEventPayload = {
  title?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  venue?: string;
  description?: string;
  url?: string;
  countryCode?: string;
};

export type BrowserFacebookImportResult = {
  ok: boolean;
  created: number;
  updated: number;
  rejected: number;
  title: string | null;
  errors: string[];
};

export function normalizeBrowserFacebookPayload(raw: BrowserFacebookEventPayload): BrowserFacebookEventPayload | null {
  const title = (raw.title ?? "").replace(/\s*\|\s*Facebook\s*$/i, "").trim();
  const url = (raw.url ?? "").trim();
  const startDate = toCalendarDate(raw.startDate);
  if (!title || !url || !startDate || !url.includes("facebook.com/events/")) return null;

  const endDate = toCalendarDate(raw.endDate) ?? startDate;
  const city = (raw.city ?? "").trim() || guessCity(raw.description) || "Vilnius";
  const countryCode = (raw.countryCode ?? guessCountry(city, raw.description) ?? "lt").toLowerCase();

  return {
    title,
    url: url.split("?")[0],
    startDate,
    endDate: endDate >= startDate ? endDate : startDate,
    city,
    venue: (raw.venue ?? "").trim() || undefined,
    description: (raw.description ?? "").trim() || undefined,
    countryCode,
  };
}

export async function importBrowserFacebookEvent(
  raw: BrowserFacebookEventPayload,
  sourceId = DEFAULT_FACEBOOK_PASTE_SOURCE_ID,
): Promise<BrowserFacebookImportResult> {
  const payload = normalizeBrowserFacebookPayload(raw);
  if (!payload || !payload.title || !payload.startDate || !payload.url) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      rejected: 0,
      title: null,
      errors: ["Missing title, start date, or Facebook event URL. Open a Facebook event page and try again."],
    };
  }

  const source = await loadRegistrySourceById(sourceId);
  if (!source) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      rejected: 0,
      title: payload.title,
      errors: [`Source ${sourceId} was not found. Run Apply source registry first.`],
    };
  }

  const observation: RawObservation = {
    title: payload.title,
    eventType: "TOURNAMENT",
    startDate: payload.startDate,
    endDate: payload.endDate ?? payload.startDate,
    countryCode: payload.countryCode ?? "lt",
    city: payload.city ?? "Vilnius",
    venue: payload.venue ?? null,
    description: payload.description ?? null,
    organiser: source.sourceName,
    officialEventUrl: payload.url,
    registrationUrl: payload.url,
    registrationStatus: "UNKNOWN",
    sourceName: source.sourceName,
    sourceUrl: payload.url,
    sourceType: "social_media",
    sourceConfidence: "high",
    sourceExternalId: eventIdFromUrl(payload.url),
    catalogSection: catalogSectionForCountry(payload.countryCode ?? "lt") ?? "lithuania",
    registrySourceType: "FACEBOOK_EVENT",
    visibility: "public",
  };

  const ingest = await ingestObservationsFromRegistry(source, [observation]);
  return {
    ok: ingest.created > 0 || ingest.updated > 0 || ingest.attached > 0,
    created: ingest.created,
    updated: ingest.updated,
    rejected: ingest.rejected,
    title: payload.title,
    errors: ingest.errors,
  };
}

function eventIdFromUrl(url: string): string | null {
  const match = url.match(/\/events\/(\d+)/);
  return match ? `fb-event-${match[1]}` : null;
}

function guessCity(description: string | undefined): string | null {
  if (!description) return null;
  const cities = ["Vilnius", "Kaunas", "Klaipėda", "Klaipeda", "Šiauliai", "Siauliai", "Panevėžys", "Panevezys", "Rīga", "Riga", "Tallinn", "Tartu"];
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(description)) return city.replace("Klaipeda", "Klaipėda").replace("Siauliai", "Šiauliai").replace("Panevezys", "Panevėžys").replace("Riga", "Rīga");
  }
  return null;
}

function guessCountry(city: string, description: string | undefined): string | null {
  const blob = `${city} ${description ?? ""}`.toLowerCase();
  if (/\b(rīga|riga|latv)/i.test(blob)) return "lv";
  if (/\b(tallinn|tartu|estoni)/i.test(blob)) return "ee";
  if (/\b(vilnius|kaunas|klaip|lietuv|lithuan)/i.test(blob)) return "lt";
  return null;
}
