import { politeFetch } from "@/lib/discovery/http";
import type { RawObservation } from "@/lib/discovery/types";
import { mapRegistryToSourceType, type RegistrySource } from "@/lib/discovery/registry-types";

type GraphEvent = {
  id: string;
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  place?: { name?: string; location?: { city?: string; country?: string } };
  ticket_uri?: string;
};

export function facebookAccessToken(): string | null {
  const token =
    process.env.FACEBOOK_ACCESS_TOKEN?.trim() ??
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ??
    process.env.META_GRAPH_ACCESS_TOKEN?.trim();
  if (!token || token.includes("SENSITIVE")) return null;
  return token;
}

async function resolveGraphNodeId(source: RegistrySource, token: string): Promise<string | null> {
  const meta = source.metadata;
  if (typeof meta.facebookId === "string" && meta.facebookId) return meta.facebookId;
  if (typeof meta.pageId === "string" && meta.pageId) return meta.pageId;
  if (typeof meta.groupId === "string" && meta.groupId) return meta.groupId;

  const pageUrl = source.facebookUrl ?? source.url;
  const url = new URL("https://graph.facebook.com/v21.0/");
  url.searchParams.set("id", pageUrl);
  url.searchParams.set("fields", "id");
  url.searchParams.set("access_token", token);

  const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const json = (await response.json()) as { id?: string };
  return json.id ?? null;
}

/** Official Facebook Events on a page (requires Graph API token with pages_read_engagement or similar). */
export async function fetchFacebookPageEvents(
  source: RegistrySource,
  limit = 25,
): Promise<{ events: RawObservation[]; error: string | null }> {
  const token = facebookAccessToken();
  if (!token) {
    return {
      events: [],
      error: "Set FACEBOOK_ACCESS_TOKEN on Vercel (Meta Graph API user or page token with events access).",
    };
  }

  if (source.registrySourceType !== "FACEBOOK_PAGE" && source.registrySourceType !== "FACEBOOK_EVENT") {
    return { events: [], error: null };
  }

  const nodeId = await resolveGraphNodeId(source, token);
  if (!nodeId) {
    return { events: [], error: `Could not resolve Facebook page id for ${source.sourceName}.` };
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(nodeId)}/events`);
  url.searchParams.set(
    "fields",
    "id,name,description,start_time,end_time,place,ticket_uri",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  try {
    const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
    const body = await response.text();
    if (!response.ok) {
      return {
        events: [],
        error: `Facebook events API ${response.status}: ${body.slice(0, 220)}`,
      };
    }
    const json = JSON.parse(body) as { data?: GraphEvent[] };
    const events = (json.data ?? [])
      .filter((row) => row.name && row.start_time)
      .map((row) => mapGraphEvent(source, row))
      .filter((row): row is RawObservation => Boolean(row));

    return { events, error: events.length === 0 ? "No upcoming Facebook Events returned for this page." : null };
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : "Facebook events fetch failed.",
    };
  }
}

function mapGraphEvent(source: RegistrySource, event: GraphEvent): RawObservation | null {
  const start = event.start_time?.slice(0, 10);
  if (!start || !event.name?.trim()) return null;
  const end = event.end_time?.slice(0, 10) ?? start;
  const eventUrl = `https://www.facebook.com/events/${event.id}`;

  return {
    title: event.name.trim(),
    eventType: "TOURNAMENT",
    startDate: start,
    endDate: end,
    countryCode: source.countryCode ?? "lt",
    city: event.place?.location?.city ?? source.city,
    venue: event.place?.name ?? null,
    organiser: source.sourceName,
    officialEventUrl: eventUrl,
    registrationUrl: event.ticket_uri ?? null,
    description: event.description?.trim() ?? null,
    registrationStatus: event.ticket_uri ? "open" : "unknown",
    sourceName: source.sourceName,
    sourceUrl: eventUrl,
    sourceType: mapRegistryToSourceType(source.registrySourceType),
    sourceConfidence: "medium",
    registrySourceType: "FACEBOOK_EVENT",
  };
}
