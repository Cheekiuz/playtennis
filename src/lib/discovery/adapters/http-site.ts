import { politeFetch } from "@/lib/discovery/http";
import type { RawObservation } from "@/lib/discovery/types";
import { mapRegistryToSourceType, type RegistrySource } from "@/lib/discovery/registry-types";

export type HttpSiteResult = {
  observations: RawObservation[];
  error: string | null;
};

export async function collectFromHttpSite(source: RegistrySource): Promise<HttpSiteResult> {
  const base = source.url.replace(/\/$/, "");
  const eventsPath = typeof source.metadata.eventsPath === "string" ? source.metadata.eventsPath : "/";
  const target = `${base}${eventsPath}`;

  try {
    const response = await politeFetch(target, {
      headers: { Accept: "text/html,application/json" },
    });
    if (!response.ok) {
      return { observations: [], error: `HTTP ${response.status} for ${target}` };
    }
    const body = await response.text();
    const jsonLd = extractJsonLdEvents(body);
    if (jsonLd.length > 0) {
      return {
        observations: jsonLd.map((event, index) => mapJsonLd(source, event, `${target}#${index}`)),
        error: null,
      };
    }

    const links = extractEventLinks(body, base);
    if (links.length === 0) {
      return {
        observations: [],
        error: "No structured events or event links found on the public page (may need a dedicated adapter).",
      };
    }

    return {
      observations: links.slice(0, 8).map((link) => ({
        title: link.title,
        startDate: link.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: link.startDate ?? new Date().toISOString().slice(0, 10),
        countryCode: source.countryCode ?? "lt",
        city: source.city,
        venue: source.registrySourceType === "VENUE" ? source.sourceName : null,
        organiser: source.registrySourceType === "VENUE" ? null : source.sourceName,
        officialEventUrl: link.url,
        sourceName: source.sourceName,
        sourceUrl: link.url,
        sourceType: mapRegistryToSourceType(source.registrySourceType),
        sourceConfidence: "medium",
        registrationStatus: "unknown",
      })),
      error: null,
    };
  } catch (error) {
    return {
      observations: [],
      error: error instanceof Error ? error.message : "HTTP site fetch failed.",
    };
  }
}

type JsonLdEvent = {
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: { name?: string; address?: { addressLocality?: string } };
  url?: string;
  description?: string;
  organizer?: { name?: string };
};

function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const events: JsonLdEvent[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]) as unknown;
      flattenJsonLd(parsed).forEach((node) => {
        if (typeof node !== "object" || !node) return;
        const record = node as Record<string, unknown>;
        const type = record["@type"];
        if (type === "SportsEvent" || type === "Event") {
          events.push(record as JsonLdEvent);
        }
      });
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return events;
}

function flattenJsonLd(node: unknown): unknown[] {
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (typeof node === "object" && node) {
    const graph = (node as Record<string, unknown>)["@graph"];
    if (graph) return flattenJsonLd(graph);
  }
  return [node];
}

function mapJsonLd(source: RegistrySource, event: JsonLdEvent, fallbackUrl: string): RawObservation {
  const start = event.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const end = event.endDate?.slice(0, 10) ?? start;
  return {
    title: event.name?.trim() || `${source.sourceName} event`,
    startDate: start,
    endDate: end,
    countryCode: source.countryCode ?? "lt",
    city: event.location?.address?.addressLocality ?? source.city,
    venue: event.location?.name ?? (source.registrySourceType === "VENUE" ? source.sourceName : null),
    organiser: event.organizer?.name ?? (source.registrySourceType === "VENUE" ? null : source.sourceName),
    officialEventUrl: event.url ?? fallbackUrl,
    description: event.description ?? null,
    sourceName: source.sourceName,
    sourceUrl: event.url ?? fallbackUrl,
    sourceType: mapRegistryToSourceType(source.registrySourceType),
    sourceConfidence: "medium",
    registrationStatus: "unknown",
  };
}

function extractEventLinks(html: string, base: string): Array<{ title: string; url: string; startDate: string | null }> {
  const links: Array<{ title: string; url: string; startDate: string | null }> = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{5,120})<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) && links.length < 20) {
    const href = match[1];
    const title = match[2].replace(/\s+/g, " ").trim();
    if (!/turnyr|tournament|event|registr/i.test(title)) continue;
    const url = href.startsWith("http") ? href : new URL(href, base).toString();
    links.push({ title, url, startDate: null });
  }
  return links;
}
