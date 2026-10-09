import type { RegistrySource } from "@/lib/discovery/registry-types";

/** Fallback registry when DB columns are not migrated yet. Mirrors supabase/source-registry.sql. */
export const REGISTRY_SEEDS: RegistrySource[] = [
  fb(
    "00000000-0000-4000-8000-000000000020",
    "Tenisininkai",
    "FACEBOOK_GROUP",
    "https://www.facebook.com/groups/119063918172498",
    92,
    null,
    { groupId: "119063918172498", feedLimit: 50 },
  ),
  fb("00000000-0000-4000-8000-000000000021", "TENISO TURNYRAI", "FACEBOOK_GROUP", "https://www.facebook.com/groups/tenisoturnyrai", 90),
  fb("00000000-0000-4000-8000-000000000022", "Lietuvos teniso mėgėjų čempionatas", "FACEBOOK_PAGE", "https://www.facebook.com/LTAmateurTennisChampionship", 85),
  fb("00000000-0000-4000-8000-000000000023", "Lauko tenisas Elektrėnuose", "FACEBOOK_PAGE", "https://www.facebook.com/laukoteniselektrenuose", 70, "Elektrėnai"),
  site("00000000-0000-4000-8000-000000000030", "TenisoNamai", "ORGANIZER_WEBSITE", "https://tenisonamai.lt", 80),
  site("00000000-0000-4000-8000-000000000031", "Topspin", "ORGANIZER_WEBSITE", "https://topspin.lt", 80),
  site("00000000-0000-4000-8000-000000000032", "iMatch", "TOURNAMENT_PLATFORM", "https://imatch.lt", 80),
  site("00000000-0000-4000-8000-000000000033", "TennisPassion", "ORGANIZER_WEBSITE", "https://tennispassion.lt", 75),
  site("00000000-0000-4000-8000-000000000034", "TenisoTurnyrai.com", "TOURNAMENT_PLATFORM", "https://tenisoturnyrai.com", 85),
  site("00000000-0000-4000-8000-000000000035", "TenisoTuras", "ORGANIZER_WEBSITE", "https://tenisoturas.lt", 70),
  site("00000000-0000-4000-8000-000000000036", "Teniso Piramidė", "ORGANIZER_WEBSITE", "https://tenisopyramide.lt", 70),
  site("00000000-0000-4000-8000-000000000037", "Nidos Setas", "CLUB", "https://nidossetas.lt", 65, "Nida"),
  site("00000000-0000-4000-8000-000000000038", "Club Dubingiai", "CLUB", "https://clubdubingiai.lt", 65, "Dubingiai"),
  venue("00000000-0000-4000-8000-000000000039", "Widen Arena", "https://widenarena.lt", "Vilnius"),
  venue("00000000-0000-4000-8000-00000000003a", "SEB Arena", "https://sebarena.lt", "Vilnius"),
  venue("00000000-0000-4000-8000-00000000003b", "Tennis Space", "https://tennisspace.lt", null),
  venue("00000000-0000-4000-8000-00000000003c", "Teniso Erdvė", "https://tenisoerdve.lt", null),
  site("00000000-0000-4000-8000-00000000003d", "Tennis Star", "CLUB", "https://tennisstar.lt", 65),
  {
    id: "00000000-0000-4000-8000-000000000010",
    sourceName: "Lietuvos teniso sąjunga (play.tennis.lt)",
    registrySourceType: "OFFICIAL_FEDERATION",
    sourceType: "federation",
    url: "https://play.tennis.lt/tournaments",
    facebookUrl: null,
    city: null,
    countryCode: "lt",
    region: "baltics",
    active: true,
    priority: 95,
    scrapingMethod: "tournated_graphql",
    lastChecked: null,
    lastSuccessfulScrape: null,
    metadata: {},
  },
];

function fb(
  id: string,
  name: string,
  type: "FACEBOOK_PAGE" | "FACEBOOK_GROUP",
  url: string,
  priority: number,
  city: string | null = null,
  metadata: Record<string, unknown> = {},
): RegistrySource {
  return {
    id,
    sourceName: name,
    registrySourceType: type,
    sourceType: "social_media",
    url,
    facebookUrl: url,
    city,
    countryCode: "lt",
    region: "baltics",
    active: true,
    priority,
    scrapingMethod: "facebook_graph",
    lastChecked: null,
    lastSuccessfulScrape: null,
    metadata,
  };
}

function site(
  id: string,
  name: string,
  type: RegistrySource["registrySourceType"],
  url: string,
  priority: number,
  city: string | null = null,
): RegistrySource {
  return {
    id,
    sourceName: name,
    registrySourceType: type,
    sourceType: type === "TOURNAMENT_PLATFORM" ? "tournament_platform" : "tournament_organiser",
    url,
    facebookUrl: null,
    city,
    countryCode: "lt",
    region: "baltics",
    active: true,
    priority,
    scrapingMethod: "http_site",
    lastChecked: null,
    lastSuccessfulScrape: null,
    metadata: {},
  };
}

function venue(id: string, name: string, url: string, city: string | null): RegistrySource {
  return {
    id,
    sourceName: name,
    registrySourceType: "VENUE",
    sourceType: "tennis_centre",
    url,
    facebookUrl: null,
    city,
    countryCode: "lt",
    region: "baltics",
    active: true,
    priority: 75,
    scrapingMethod: "http_site",
    lastChecked: null,
    lastSuccessfulScrape: null,
    metadata: {},
  };
}
