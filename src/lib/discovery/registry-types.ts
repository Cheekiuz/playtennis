import type { SourceType } from "@/lib/discovery/types";

export const REGISTRY_SOURCE_TYPES = [
  "ORGANIZER_WEBSITE",
  "TOURNAMENT_PLATFORM",
  "OFFICIAL_FEDERATION",
  "CLUB",
  "VENUE",
  "FACEBOOK_PAGE",
  "FACEBOOK_GROUP",
  "FACEBOOK_EVENT",
  "FACEBOOK_POST",
  "OTHER",
] as const;

export type RegistrySourceType = (typeof REGISTRY_SOURCE_TYPES)[number];

export const SCRAPING_METHODS = [
  "tournated_graphql",
  "facebook_graph",
  "http_site",
  "wordpress_events",
  "manual",
] as const;

export type ScrapingMethod = (typeof SCRAPING_METHODS)[number];

export const DISCOVERY_STAGES = [
  "DISCOVERED",
  "PARSED",
  "DEDUPLICATED",
  "VALIDATED",
  "PUBLISHED",
] as const;

export type DiscoveryStage = (typeof DISCOVERY_STAGES)[number];

export type RegistrySource = {
  id: string;
  sourceName: string;
  registrySourceType: RegistrySourceType;
  sourceType: SourceType;
  url: string;
  facebookUrl: string | null;
  city: string | null;
  countryCode: string | null;
  region: string | null;
  active: boolean;
  priority: number;
  scrapingMethod: ScrapingMethod;
  lastChecked: string | null;
  lastSuccessfulScrape: string | null;
  metadata: Record<string, unknown>;
};

export function mapRegistryToSourceType(registryType: RegistrySourceType): SourceType {
  switch (registryType) {
    case "OFFICIAL_FEDERATION":
      return "federation";
    case "ORGANIZER_WEBSITE":
      return "tournament_organiser";
    case "TOURNAMENT_PLATFORM":
      return "tournament_platform";
    case "CLUB":
      return "club";
    case "VENUE":
      return "tennis_centre";
    case "FACEBOOK_PAGE":
    case "FACEBOOK_GROUP":
    case "FACEBOOK_EVENT":
    case "FACEBOOK_POST":
      return "social_media";
    default:
      return "other";
  }
}

export function tournamentSourceKind(registryType: RegistrySourceType): string {
  if (
    registryType === "FACEBOOK_PAGE" ||
    registryType === "FACEBOOK_GROUP" ||
    registryType === "FACEBOOK_EVENT" ||
    registryType === "FACEBOOK_POST"
  ) {
    return "FACEBOOK";
  }
  if (registryType === "VENUE") return "VENUE";
  if (registryType === "TOURNAMENT_PLATFORM" || registryType === "OFFICIAL_FEDERATION") {
    return "AGGREGATOR";
  }
  return "ORGANISER_WEBSITE";
}
