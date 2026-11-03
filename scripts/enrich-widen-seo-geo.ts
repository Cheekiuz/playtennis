import { collectWidenArenaGames } from "../src/lib/discovery/adapters/lt-site-adapters";
import { normalizeObservation } from "../src/lib/discovery/normalize";
import { REGISTRY_SEEDS } from "../src/lib/discovery/registry-seeds";
import { createServerSupabaseClient } from "../src/lib/supabase/server";

async function main() {
  const source = REGISTRY_SEEDS.find((row) => row.sourceName === "Widen Arena");
  if (!source) throw new Error("Widen Arena seed missing.");

  const collected = await collectWidenArenaGames(source);
  if (collected.observations.length === 0) {
    throw new Error(collected.error || "No Widen observations.");
  }

  const supabase = createServerSupabaseClient();
  const sample = normalizeObservation(collected.observations[0]);

  let venueId: string | null = null;
  const existingVenue = await supabase
    .from("venues")
    .select("id")
    .eq("name", "Widen Arena")
    .eq("city", "Vilnius")
    .maybeSingle();

  if (existingVenue.data?.id) {
    venueId = existingVenue.data.id as string;
    await supabase
      .from("venues")
      .update({
        address: sample.address,
        latitude: sample.latitude,
        longitude: sample.longitude,
        country_code: "lt",
        updated_at: new Date().toISOString(),
      })
      .eq("id", venueId);
  } else {
    const inserted = await supabase
      .from("venues")
      .insert({
        name: "Widen Arena",
        address: sample.address,
        city: "Vilnius",
        country_code: "lt",
        latitude: sample.latitude,
        longitude: sample.longitude,
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || "Venue insert failed.");
    venueId = inserted.data.id as string;
  }

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id,slug,name,starts_on,source_external_id,price_amount,price_currency,start_time")
    .ilike("source_external_id", "widen-group-%")
    .order("starts_on");
  if (error) throw new Error(error.message);

  const byExternal = new Map(collected.observations.map((row) => [row.sourceExternalId, row]));
  const results: Array<Record<string, unknown>> = [];

  for (const tournament of tournaments ?? []) {
    const raw = byExternal.get(String(tournament.source_external_id));
    const event = raw ? normalizeObservation(raw) : null;
    const place = "Widen Arena, Vilnius";
    const price =
      tournament.price_amount != null
        ? `${tournament.price_amount} ${tournament.price_currency || "EUR"}`
        : null;
    const level = event?.originalLevel;
    const format = event?.format;
    const time = tournament.start_time
      ? String(tournament.start_time).slice(0, 5)
      : raw?.startTime
        ? String(raw.startTime).slice(0, 5)
        : null;

    const formatLt = format === "doubles" ? "dvejetai" : format === "singles" ? "vienetai" : "tenisas";
    const formatEn = format === "doubles" ? "doubles" : format === "singles" ? "singles" : "tennis";
    const levelLt =
      level === "beginner" ? "pradedantieji" : level === "intermediate" ? "pažengę" : level === "advanced" ? "pažengę+" : null;
    const levelEn =
      level === "beginner" ? "beginner" : level === "intermediate" ? "intermediate" : level === "advanced" ? "advanced" : null;
    const dateLabel = `${tournament.starts_on}${time ? ` ${time}` : ""}`;

    const seoTitleLt = ["MEET&PLAY", formatLt, levelLt, dateLabel, "| Widen Arena"].filter(Boolean).join(" ").slice(0, 70);
    const seoTitleEn = ["MEET&PLAY", formatEn, levelEn, dateLabel, "| Widen Arena"].filter(Boolean).join(" ").slice(0, 70);
    const seoDescriptionLt = [
      `Socialinis teniso MEET&PLAY (${formatLt}${levelLt ? `, ${levelLt}` : ""}) Widen Arena, Alksnynų g. 4, Vilnius.`,
      `${dateLabel}.`,
      price ? `Nuo ${price}.` : null,
      "Vidaus kortai.",
    ]
      .filter(Boolean)
      .join(" ");
    const seoDescriptionEn = [
      `Social tennis MEET&PLAY (${formatEn}${levelEn ? `, ${levelEn}` : ""}) at Widen Arena, Alksnynų g. 4, Vilnius.`,
      `${dateLabel}.`,
      price ? `From ${price}.` : null,
      "Indoor courts.",
    ]
      .filter(Boolean)
      .join(" ");

    const descriptionLt = [
      seoDescriptionLt,
      event?.description || null,
      "Registracija: widenarena.lt/games.",
    ]
      .filter(Boolean)
      .join(" ");
    const descriptionEn = [
      seoDescriptionEn,
      event?.description || null,
      "Register at widenarena.lt/games.",
    ]
      .filter(Boolean)
      .join(" ");

    await supabase
      .from("tournaments")
      .update({
        venue_id: venueId,
        city: "Vilnius",
        environment: "indoor",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tournament.id);

    await supabase.from("tournament_translations").upsert(
      [
        {
          tournament_id: tournament.id,
          locale: "lt",
          description: descriptionLt,
          seo_title: seoTitleLt,
          seo_description: seoDescriptionLt,
        },
        {
          tournament_id: tournament.id,
          locale: "en",
          description: descriptionEn,
          seo_title: seoTitleEn,
          seo_description: seoDescriptionEn,
        },
      ],
      { onConflict: "tournament_id,locale" },
    );

    results.push({
      slug: tournament.slug,
      venueId,
      seoTitleLt,
      seoDescriptionLt,
    });
  }

  console.log(JSON.stringify({ venueId, updated: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
