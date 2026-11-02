import { collectWidenArenaGames } from "../src/lib/discovery/adapters/lt-site-adapters";
import { ingestObservationsFromRegistry } from "../src/lib/discovery/ingest";
import { REGISTRY_SEEDS } from "../src/lib/discovery/registry-seeds";
import { createServerSupabaseClient } from "../src/lib/supabase/server";

async function ensureWidenSource() {
  const seed = REGISTRY_SEEDS.find((row) => row.sourceName === "Widen Arena");
  if (!seed) throw new Error("Widen Arena seed missing.");

  const supabase = createServerSupabaseClient();
  const row = {
    id: seed.id,
    kind: "import",
    name: seed.sourceName,
    url: seed.url,
    ingestion: "feed",
    source_type: seed.sourceType,
    registry_source_type: seed.registrySourceType,
    scraping_method: seed.scrapingMethod,
    country_code: seed.countryCode?.toUpperCase() ?? "LT",
    city: seed.city,
    region: seed.region,
    active: true,
    priority: seed.priority,
    trust_level: "medium",
    metadata: seed.metadata,
  };

  const upserted = await supabase.from("sources").upsert(row, { onConflict: "id" }).select("id,name").single();
  if (upserted.error) {
    const byUrl = await supabase
      .from("sources")
      .upsert(
        {
          kind: "import",
          name: seed.sourceName,
          url: seed.url,
          ingestion: "feed",
          source_type: seed.sourceType,
          active: true,
        },
        { onConflict: "url" },
      )
      .select("id,name")
      .single();
    if (byUrl.error || !byUrl.data) {
      throw new Error(upserted.error.message || byUrl.error?.message || "Could not upsert Widen Arena source.");
    }
    return { ...seed, id: String(byUrl.data.id) };
  }

  return seed;
}

async function clearPartialWidenListings(sourceId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("tournaments")
    .select("id,slug,name,source_external_id,official_url,source_url,source_id")
    .or(
      [
        `source_id.eq.${sourceId}`,
        "source_external_id.ilike.widen-group-%",
        "source_url.ilike.%widenarena.lt/games%",
        "official_url.ilike.%widenarena.lt/games%",
      ].join(","),
    );
  const rows = (data ?? []).filter((row) => {
    const external = String(row.source_external_id ?? "");
    const sourceUrl = String(row.source_url ?? "");
    const officialUrl = String(row.official_url ?? "");
    return (
      row.source_id === sourceId ||
      external.startsWith("widen-group-") ||
      sourceUrl.includes("widenarena.lt/games") ||
      officialUrl.includes("widenarena.lt/games")
    );
  });
  if (rows.length === 0) return { deleted: 0 };
  const ids = rows.map((row) => row.id as string);
  await supabase.from("event_sources").delete().in("tournament_id", ids);
  await supabase.from("tournament_categories").delete().in("tournament_id", ids);
  const deleted = await supabase.from("tournaments").delete().in("id", ids);
  if (deleted.error) throw new Error(deleted.error.message);
  return { deleted: ids.length, slugs: rows.map((row) => row.slug) };
}

async function main() {
  const source = await ensureWidenSource();
  const cleared = await clearPartialWidenListings(source.id);
  const collected = await collectWidenArenaGames(source);
  if (collected.error && collected.observations.length === 0) {
    console.error(collected.error);
    process.exit(1);
  }

  const summary = await ingestObservationsFromRegistry(source, collected.observations, { dryRun: false });
  console.log(
    JSON.stringify(
      {
        sourceId: source.id,
        cleared,
        collected: collected.observations.length,
        titles: collected.observations.map((row) => ({ title: row.title, startDate: row.startDate, price: row.priceAmount })),
        summary,
      },
      null,
      2,
    ),
  );

  if (summary.errors.length > 0) process.exit(1);
  if (summary.created + summary.updated < collected.observations.length) {
    console.error("Not all Widen Arena tennis groups were published.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
