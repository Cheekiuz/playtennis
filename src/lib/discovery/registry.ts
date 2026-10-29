import { REGISTRY_SEEDS } from "@/lib/discovery/registry-seeds";
import {
  mapRegistryToSourceType,
  type RegistrySource,
  type RegistrySourceType,
  type ScrapingMethod,
} from "@/lib/discovery/registry-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loadActiveRegistrySources(): Promise<RegistrySource[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("sources")
      .select(
        "id, name, url, facebook_url, city, country_code, region, active, priority, scraping_method, last_checked, last_successful_scrape, registry_source_type, source_type, metadata",
      )
      .eq("active", true)
      .not("scraping_method", "is", null)
      .order("priority", { ascending: false });

    if (error || !data?.length) {
      if (error && !/registry_source_type|scraping_method|facebook_url|schema cache/i.test(error.message)) {
        console.error("loadActiveRegistrySources", error.message);
      }
      return REGISTRY_SEEDS.filter((source) => source.active);
    }

    return data.map(mapRegistrySourceRow).filter((source) => source.active);
  } catch {
    return REGISTRY_SEEDS.filter((source) => source.active);
  }
}

export async function loadAdminRegistrySources(): Promise<RegistrySource[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("sources")
      .select(
        "id, name, url, facebook_url, city, country_code, region, active, priority, scraping_method, last_checked, last_successful_scrape, registry_source_type, source_type, metadata, kind",
      )
      .order("name", { ascending: true })
      .limit(200);

    if (error || !data?.length) {
      if (error && !/registry_source_type|scraping_method|facebook_url|schema cache/i.test(error.message)) {
        console.error("loadAdminRegistrySources", error.message);
      }
      if (error && /registry_source_type|scraping_method|facebook_url|schema cache/i.test(error.message)) {
        const plain = await supabase
          .from("sources")
          .select("id, name, url, city, country_code, active, kind")
          .order("name", { ascending: true })
          .limit(200);
        if (plain.data?.length) {
          return plain.data.map((row) =>
            mapRegistrySourceRow({
              ...row,
              registry_source_type: "OTHER",
              scraping_method: "manual",
              priority: 50,
            }),
          );
        }
      }
      return REGISTRY_SEEDS;
    }

    return data.map(mapRegistrySourceRow);
  } catch {
    return REGISTRY_SEEDS;
  }
}

export function mapRegistrySourceRow(row: Record<string, unknown>): RegistrySource {
  const registryType = (row.registry_source_type as RegistrySourceType | null) ?? "OTHER";
  return {
    id: String(row.id),
    sourceName: String(row.name),
    registrySourceType: registryType,
    sourceType: mapRegistryToSourceType(registryType),
    url: String(row.url ?? ""),
    facebookUrl: row.facebook_url ? String(row.facebook_url) : null,
    city: row.city ? String(row.city) : null,
    countryCode: row.country_code ? String(row.country_code).toLowerCase() : null,
    region: row.region ? String(row.region) : null,
    active: row.active !== false,
    priority: typeof row.priority === "number" ? row.priority : 50,
    scrapingMethod: (row.scraping_method as ScrapingMethod) ?? "http_site",
    lastChecked: row.last_checked ? String(row.last_checked) : null,
    lastSuccessfulScrape: row.last_successful_scrape ? String(row.last_successful_scrape) : null,
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
  };
}
