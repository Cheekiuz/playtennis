import { collectFromHttpSite } from "@/lib/discovery/adapters/http-site";
import { extractFromFacebookText } from "@/lib/discovery/facebook/extract";
import { fetchFacebookGroupEvents, fetchFacebookPageEvents } from "@/lib/discovery/facebook/graph-events";
import { fetchFacebookPosts } from "@/lib/discovery/facebook/graph";
import { facebookEventSearchEnabled, fetchFacebookEventSearch } from "@/lib/discovery/facebook/event-search";
import { fetchPublicFacebookEventUrls } from "@/lib/discovery/facebook/public-event-page";
import { shouldExcludeTableTennis } from "@/lib/discovery/tennis-sport";
import { FACEBOOK_SAMPLE_POSTS } from "@/lib/discovery/facebook/samples";
import {
  fetchTournatedUpcoming,
  mapTournatedItem,
  TOURNATED_LT,
  TOURNATED_LV,
} from "@/lib/discovery/tournated-public";
import type { RawObservation } from "@/lib/discovery/types";
import { mapRegistryToSourceType, type RegistrySource } from "@/lib/discovery/registry-types";

export type AdapterResult = {
  sourceId: string;
  sourceName: string;
  observations: RawObservation[];
  errors: string[];
  requiresManualHandling: boolean;
  verificationSamplesParsed: number;
};

export async function collectFromRegistrySource(source: RegistrySource): Promise<AdapterResult> {
  const errors: string[] = [];
  let requiresManualHandling = false;
  let verificationSamplesParsed = 0;
  let observations: RawObservation[] = [];

  switch (source.scrapingMethod) {
    case "tournated_graphql": {
      const platform = source.countryCode?.toLowerCase() === "lv" ? TOURNATED_LV : TOURNATED_LT;
      const items = await fetchTournatedUpcoming(platform);
      observations = items.map((item) => mapTournatedItem(item, platform));
      break;
    }
    case "facebook_graph": {
      const pageEvents = await fetchFacebookPageEvents(source);
      if (pageEvents.error && pageEvents.events.length === 0) errors.push(pageEvents.error);
      observations = [...pageEvents.events];

      const groupEvents = await fetchFacebookGroupEvents(source);
      if (groupEvents.error && groupEvents.events.length === 0 && source.registrySourceType === "FACEBOOK_GROUP") {
        errors.push(groupEvents.error);
      }
      for (const row of groupEvents.events) {
        if (!observations.some((existing) => existing.sourceUrl === row.sourceUrl)) {
          observations.push(row);
        }
      }

      const fb = await fetchFacebookPosts(source);
      if (fb.error) errors.push(fb.error);
      requiresManualHandling =
        fb.requiresManualHandling && pageEvents.events.length === 0 && groupEvents.events.length === 0;
      const fromPosts = fb.posts
        .map((post) => extractFromFacebookText(source, post))
        .filter((item): item is RawObservation => Boolean(item));
      for (const row of fromPosts) {
        if (!observations.some((existing) => existing.sourceUrl === row.sourceUrl)) {
          observations.push(row);
        }
      }

      const manualEvents = await fetchPublicFacebookEventUrls(source);
      if (manualEvents.errors.length > 0) errors.push(...manualEvents.errors);
      for (const row of manualEvents.observations) {
        if (!observations.some((existing) => existing.sourceUrl === row.sourceUrl)) {
          observations.push(row);
        }
      }
      if (manualEvents.observations.length > 0) {
        requiresManualHandling = false;
      }

      if (facebookEventSearchEnabled(source)) {
        const searchEvents = await fetchFacebookEventSearch(source);
        if (searchEvents.errors.length > 0) errors.push(...searchEvents.errors);
        for (const row of searchEvents.observations) {
          if (!observations.some((existing) => existing.sourceUrl === row.sourceUrl)) {
            observations.push(row);
          }
        }
        if (searchEvents.observations.length > 0) {
          requiresManualHandling = false;
        }
      }

      if (process.env.DISCOVERY_VERIFY_FACEBOOK_SAMPLES === "true") {
        const samples = samplePostsForSource(source);
        for (const post of samples) {
          const parsed = extractFromFacebookText(source, post);
          if (parsed) {
            verificationSamplesParsed += 1;
            if (observations.every((row) => row.sourceUrl !== parsed.sourceUrl)) {
              observations.push(parsed);
            }
          }
        }
      }
      break;
    }
    case "http_site":
    case "wordpress_events": {
      const site = await collectFromHttpSite(source);
      if (site.error) errors.push(site.error);
      observations = site.observations;
      break;
    }
    default:
      errors.push(`Unsupported scraping method: ${source.scrapingMethod}`);
      requiresManualHandling = true;
  }

  observations = observations
    .filter((row) => !shouldExcludeTableTennis(row))
    .map((row) => ({
      ...row,
      registrySourceType: source.registrySourceType,
      sourceType: row.sourceType ?? mapRegistryToSourceType(source.registrySourceType),
      countryCode: row.countryCode ?? source.countryCode ?? "lt",
      city: row.city ?? source.city,
    }));

  return {
    sourceId: source.id,
    sourceName: source.sourceName,
    observations,
    errors,
    requiresManualHandling,
    verificationSamplesParsed,
  };
}

function samplePostsForSource(source: RegistrySource) {
  const name = source.sourceName.toLowerCase();
  if (name.includes("tenisininkai")) return [FACEBOOK_SAMPLE_POSTS.tenisininkai];
  if (name.includes("teniso turnyrai")) return [FACEBOOK_SAMPLE_POSTS.tenisoTurnyrai];
  return [];
}
