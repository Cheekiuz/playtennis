import { politeFetch } from "@/lib/discovery/http";
import type { RawObservation } from "@/lib/discovery/types";
import type { RegistrySource } from "@/lib/discovery/registry-types";
import { mapRegistryToSourceType } from "@/lib/discovery/registry-types";

/** Public Facebook Event URLs listed in source metadata (no Meta developer account required). */
export function manualEventUrls(source: RegistrySource): string[] {
  const raw = source.metadata.eventUrls ?? source.metadata.manualEventUrls;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.includes("facebook.com"));
}

export async function fetchPublicFacebookEventUrls(
  source: RegistrySource,
): Promise<{ observations: RawObservation[]; errors: string[] }> {
  const urls = manualEventUrls(source);
  if (urls.length === 0) {
    return { observations: [], errors: [] };
  }

  const observations: RawObservation[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const parsed = await fetchPublicFacebookEventPage(source, url);
      if (parsed) observations.push(parsed);
      else errors.push(`Could not read public data from ${url} (Facebook may require login for this event).`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Failed to fetch ${url}`);
    }
  }

  return { observations, errors };
}

async function fetchPublicFacebookEventPage(
  source: RegistrySource,
  eventUrl: string,
): Promise<RawObservation | null> {
  const normalized = normalizeEventUrl(eventUrl);
  const response = await politeFetch(normalized, {
    headers: { Accept: "text/html" },
  });
  if (!response.ok) return null;

  const html = await response.text();
  const meta = readMetaTags(html);
  const jsonLd = readJsonLdEvent(html);

  const title = jsonLd?.name ?? meta["og:title"] ?? meta["twitter:title"];
  const startRaw = jsonLd?.startDate ?? meta["event:start_time"] ?? meta["og:updated_time"];
  const startDate = startRaw ? toDateOnly(startRaw) : null;
  if (!title?.trim() || !startDate) return null;

  const endRaw = jsonLd?.endDate ?? meta["event:end_time"];
  const endDateParsed = endRaw ? toDateOnly(endRaw) : null;
  const endDate = endDateParsed && endDateParsed >= startDate ? endDateParsed : startDate;
  const description = jsonLd?.description ?? meta["og:description"] ?? null;
  const place = jsonLd?.location;

  return {
    title: decodeHtml(title.trim()),
    eventType: "TOURNAMENT",
    startDate,
    endDate,
    countryCode: source.countryCode ?? "lt",
    city: typeof place === "object" && place && "address" in place
      ? (place as { address?: { addressLocality?: string } }).address?.addressLocality ?? source.city
      : source.city,
    venue: typeof place === "object" && place && "name" in place ? String((place as { name?: string }).name ?? "") : null,
    organiser: source.sourceName,
    officialEventUrl: normalized,
    description: description ? decodeHtml(description.trim()) : null,
    registrationStatus: "unknown",
    sourceName: source.sourceName,
    sourceUrl: normalized,
    sourceType: mapRegistryToSourceType(source.registrySourceType),
    sourceConfidence: "medium",
    registrySourceType: "FACEBOOK_EVENT",
  };
}

function normalizeEventUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes("/events/")) return trimmed.split("?")[0];
  return trimmed;
}

function readMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re = /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    tags[match[1]] = match[2];
  }
  const re2 = /<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi;
  while ((match = re2.exec(html))) {
    tags[match[2]] = match[1];
  }
  return tags;
}

function readJsonLdEvent(html: string): {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: unknown;
} | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]) as unknown;
      const nodes = flattenJsonLd(parsed);
      for (const node of nodes) {
        if (typeof node !== "object" || !node) continue;
        const record = node as Record<string, unknown>;
        if (record["@type"] === "Event" || record["@type"] === "SportsEvent") {
          return record as { name?: string; description?: string; startDate?: string; endDate?: string; location?: unknown };
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function flattenJsonLd(node: unknown): unknown[] {
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (typeof node === "object" && node) {
    const graph = (node as Record<string, unknown>)["@graph"];
    if (graph) return flattenJsonLd(graph);
  }
  return [node];
}

function toDateOnly(value: string): string | null {
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
