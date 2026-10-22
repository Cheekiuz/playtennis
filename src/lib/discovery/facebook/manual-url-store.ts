import { fetchPublicFacebookEventUrls } from "@/lib/discovery/facebook/public-event-page";
import { ingestObservationsFromRegistry } from "@/lib/discovery/ingest";
import type { RegistrySource } from "@/lib/discovery/registry-types";
import { mapRegistrySourceRow } from "@/lib/discovery/registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const DEFAULT_FACEBOOK_PASTE_SOURCE_ID = "00000000-0000-4000-8000-000000000020";

export function parseFacebookEventUrls(text: string): string[] {
  const urls = new Set<string>();
  const blob = text.trim();
  if (!blob) return [];

  for (const match of blob.matchAll(/https?:\/\/(?:www\.)?facebook\.com\/events\/(\d+)/gi)) {
    urls.add(`https://www.facebook.com/events/${match[1]}`);
  }
  for (const match of blob.matchAll(/(?:^|\s)\/?events\/(\d{10,})(?:\s|$)/g)) {
    urls.add(`https://www.facebook.com/events/${match[1]}`);
  }

  return [...urls];
}

export function mergeEventUrlList(existing: unknown, incoming: string[]): string[] {
  const base = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : [];
  return [...new Set([...base, ...incoming])];
}

export async function loadRegistrySourceById(sourceId: string): Promise<RegistrySource | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, name, url, facebook_url, city, country_code, region, active, priority, scraping_method, last_checked, last_successful_scrape, registry_source_type, source_type, metadata",
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRegistrySourceRow(data as Record<string, unknown>);
}

export type FacebookUrlImportResult = {
  savedUrls: number;
  fetched: number;
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
};

export async function importFacebookEventUrlsForSource(
  sourceId: string,
  pastedText: string,
): Promise<FacebookUrlImportResult> {
  const incoming = parseFacebookEventUrls(pastedText);
  if (incoming.length === 0) {
    return { savedUrls: 0, fetched: 0, created: 0, updated: 0, rejected: 0, errors: ["No Facebook event URLs found in the paste."] };
  }

  const supabase = createServerSupabaseClient();
  const source = await loadRegistrySourceById(sourceId);
  if (!source) {
    return {
      savedUrls: 0,
      fetched: 0,
      created: 0,
      updated: 0,
      rejected: 0,
      errors: [`Source ${sourceId} was not found. Run Apply source registry first.`],
    };
  }

  const merged = mergeEventUrlList(source.metadata.eventUrls, incoming);
  const { error: saveError } = await supabase
    .from("sources")
    .update({
      metadata: { ...source.metadata, eventUrls: merged },
      last_checked: new Date().toISOString(),
    })
    .eq("id", sourceId);

  if (saveError) {
    return {
      savedUrls: 0,
      fetched: 0,
      created: 0,
      updated: 0,
      rejected: 0,
      errors: [saveError.message],
    };
  }

  const fetchSource: RegistrySource = {
    ...source,
    metadata: { ...source.metadata, eventUrls: incoming },
  };
  const collected = await fetchPublicFacebookEventUrls(fetchSource);
  const ingest = await ingestObservationsFromRegistry(source, collected.observations);

  return {
    savedUrls: merged.length,
    fetched: collected.observations.length,
    created: ingest.created,
    updated: ingest.updated,
    rejected: ingest.rejected,
    errors: [...collected.errors, ...ingest.errors],
  };
}
