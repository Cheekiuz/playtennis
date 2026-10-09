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
  if (!token || token.includes("[SENSITIVE]")) return null;
  return token;
}

function numericGroupIdFromUrl(url: string): string | null {
  const match = url.match(/facebook\.com\/groups\/(\d+)/i);
  return match ? match[1] : null;
}

export async function resolveGraphNodeId(source: RegistrySource, token: string): Promise<string | null> {
  const meta = source.metadata;
  if (typeof meta.groupId === "string" && meta.groupId) return meta.groupId;
  if (typeof meta.facebookId === "string" && meta.facebookId) return meta.facebookId;
  if (typeof meta.pageId === "string" && meta.pageId) return meta.pageId;

  const pageUrl = source.facebookUrl ?? source.url;
  const numeric = numericGroupIdFromUrl(pageUrl);
  if (numeric) return numeric;

  const url = new URL("https://graph.facebook.com/v21.0/");
  url.searchParams.set("id", pageUrl);
  url.searchParams.set("fields", "id");
  url.searchParams.set("access_token", token);

  const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const json = (await response.json()) as { id?: string };
  return json.id ?? null;
}

async function fetchEventsAtEdge(
  nodeId: string,
  token: string,
  source: RegistrySource,
  limit: number,
): Promise<RawObservation[]> {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(nodeId)}/events`);
  url.searchParams.set("fields", "id,name,description,start_time,end_time,place,ticket_uri");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: GraphEvent[] };
  return (json.data ?? [])
    .map((row) => mapGraphEvent(source, row))
    .filter((row): row is RawObservation => Boolean(row));
}

async function fetchEventById(eventId: string, token: string, source: RegistrySource): Promise<RawObservation | null> {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(eventId)}`);
  url.searchParams.set("fields", "id,name,description,start_time,end_time,place,ticket_uri");
  url.searchParams.set("access_token", token);
  const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const json = (await response.json()) as GraphEvent;
  return mapGraphEvent(source, json);
}

async function fetchEventsFromGroupFeed(
  groupId: string,
  token: string,
  source: RegistrySource,
  feedLimit: number,
): Promise<{ events: RawObservation[]; eventIds: string[] }> {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(groupId)}/feed`);
  url.searchParams.set(
    "fields",
    "id,message,permalink_url,created_time,attachments{target{id},media_type,title,description}",
  );
  url.searchParams.set("limit", String(feedLimit));
  url.searchParams.set("access_token", token);

  const response = await politeFetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return { events: [], eventIds: [] };

  const json = (await response.json()) as {
    data?: Array<{
      attachments?: { data?: Array<{ target?: { id?: string }; media_type?: string; title?: string; description?: string }> };
    }>;
  };

  const eventIds = new Set<string>();
  for (const row of json.data ?? []) {
    for (const attachment of row.attachments?.data ?? []) {
      const id = attachment.target?.id;
      if (id) eventIds.add(id);
    }
  }

  const events: RawObservation[] = [];
  for (const eventId of eventIds) {
    const mapped = await fetchEventById(eventId, token, source);
    if (mapped) events.push(mapped);
  }
  return { events, eventIds: [...eventIds] };
}

/** Facebook Events listed on a page. */
export async function fetchFacebookPageEvents(
  source: RegistrySource,
  limit = 25,
): Promise<{ events: RawObservation[]; error: string | null }> {
  const token = facebookAccessToken();
  if (!token) {
    return { events: [], error: null };
  }

  if (source.registrySourceType !== "FACEBOOK_PAGE" && source.registrySourceType !== "FACEBOOK_EVENT") {
    return { events: [], error: null };
  }

  const nodeId = await resolveGraphNodeId(source, token);
  if (!nodeId) {
    return { events: [], error: `Could not resolve Facebook page id for ${source.sourceName}.` };
  }

  try {
    const events = await fetchEventsAtEdge(nodeId, token, source, limit);
    return {
      events,
      error: events.length === 0 ? "No upcoming Facebook Events returned for this page." : null,
    };
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : "Facebook events fetch failed.",
    };
  }
}

/** Events from a group: /events edge plus event attachments on the group feed. */
export async function fetchFacebookGroupEvents(
  source: RegistrySource,
): Promise<{ events: RawObservation[]; error: string | null }> {
  const token = facebookAccessToken();
  if (!token) {
    return { events: [], error: null };
  }

  if (source.registrySourceType !== "FACEBOOK_GROUP") {
    return { events: [], error: null };
  }

  const feedLimit =
    typeof source.metadata.feedLimit === "number" && source.metadata.feedLimit > 0
      ? source.metadata.feedLimit
      : 50;

  const groupId = await resolveGraphNodeId(source, token);
  if (!groupId) {
    return { events: [], error: `Could not resolve Facebook group id for ${source.sourceName}.` };
  }

  try {
    const fromEdge = await fetchEventsAtEdge(groupId, token, source, feedLimit);
    const fromFeed = await fetchEventsFromGroupFeed(groupId, token, source, feedLimit);

    const byUrl = new Map<string, RawObservation>();
    for (const row of [...fromEdge, ...fromFeed.events]) {
      byUrl.set(row.sourceUrl, row);
    }
    const events = [...byUrl.values()];

    return {
      events,
      error:
        events.length === 0
          ? "No Facebook Events found for this group (check token permissions: groups access + read engagement)."
          : null,
    };
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : "Facebook group events fetch failed.",
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
