import { countryCatalogRegion } from "@/lib/discovery/places";
import { normalizeObservation } from "@/lib/discovery/normalize";
import { scoreQuality } from "@/lib/discovery/quality";
import type { SourceConnector } from "@/lib/discovery/connectors";
import {
  fetchTournatedUpcoming,
  mapTournatedItem,
  TOURNATED_PLATFORMS,
  type TournatedPlatformConfig,
} from "@/lib/discovery/tournated-public";
import type { DuplicateCandidate, RawObservation, ReviewStatus } from "@/lib/discovery/types";
import { preparePublication } from "@/lib/discovery/workflow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dedupeKey } from "@/lib/tournaments/feed";
import { regionName } from "@/lib/tournaments/countries";
import { slugify } from "@/lib/tournaments/admin";

export type IngestSummary = {
  collected: number;
  created: number;
  updated: number;
  attached: number;
  review: number;
  rejected: number;
  errors: string[];
};

export function ingestIsEnabled(): boolean {
  return process.env.INGEST_ENABLED === "true" || process.env.INGEST_LTS_ENABLED === "true";
}

export async function ingestAllEnabled(): Promise<Record<string, IngestSummary>> {
  const results: Record<string, IngestSummary> = {};
  for (const platform of platformsToIngest()) {
    results[platform.id] = await ingestTournatedPlatform(platform);
  }
  return results;
}

export async function ingestTournatedPlatform(platform: TournatedPlatformConfig): Promise<IngestSummary> {
  const items = await fetchTournatedUpcoming(platform);
  const observations = items.map((item) => mapTournatedItem(item, platform));
  return ingestObservations(observations, {
    sourceKey: `tournated_${platform.id}`,
    sourceName: platform.sourceName,
    sourceUrl: `${platform.siteOrigin}/tournaments`,
    sourceType: "federation",
    trustLevel: "high",
    countryCode: platform.countryCode,
    slugPrefix: platform.id,
  });
}

/** @deprecated Use ingestTournatedPlatform(TOURNATED_LT) or ingestAllEnabled(). */
export async function ingestLtsUpcoming(): Promise<IngestSummary> {
  return ingestTournatedPlatform(TOURNATED_PLATFORMS[0]);
}

export async function ingestFromConnector(connector: SourceConnector): Promise<IngestSummary> {
  const observations = await connector.collect();
  const listUrl = connector.listUrl ?? "https://play.tennis.lt/tournaments";
  return ingestObservations(observations, {
    sourceKey: connector.id,
    sourceName: connector.name,
    sourceUrl: listUrl,
    sourceType: connector.sourceType,
    trustLevel: connector.sourceType === "federation" ? "high" : "medium",
    countryCode: connector.countryCode,
    slugPrefix: connector.countryCode ?? "event",
  });
}

function platformsToIngest(): TournatedPlatformConfig[] {
  const raw = process.env.INGEST_TOURNATED_PLATFORMS;
  if (!raw?.trim()) return [...TOURNATED_PLATFORMS];
  const wanted = new Set(raw.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean));
  return TOURNATED_PLATFORMS.filter((platform) => wanted.has(platform.id));
}

type SourceMeta = {
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  trustLevel: "high" | "medium" | "low";
  countryCode: string | null;
  slugPrefix: string;
};

async function ingestObservations(observations: RawObservation[], source: SourceMeta): Promise<IngestSummary> {
  const summary: IngestSummary = {
    collected: observations.length,
    created: 0,
    updated: 0,
    attached: 0,
    review: 0,
    rejected: 0,
    errors: [],
  };

  const supabase = createServerSupabaseClient();
  const sourceId = await ensureSource(supabase, source);
  if (!sourceId) {
    summary.errors.push("Could not resolve the import source.");
    return summary;
  }

  const existing = await loadDuplicateCandidates(supabase);
  const dryRun = process.env.INGEST_DRY_RUN === "true";

  for (const raw of observations) {
    try {
      const externalId = externalIdFrom(raw);
      const prior = externalId ? await findByExternalId(supabase, sourceId, externalId) : null;
      if (prior) {
        if (!dryRun) await refreshExisting(supabase, prior.id, raw, sourceId, source.slugPrefix);
        summary.updated += 1;
        continue;
      }

      const decision = preparePublication(existing, raw);
      if (decision.action === "reject") {
        summary.rejected += 1;
        continue;
      }
      if (decision.action === "review") {
        summary.review += 1;
        if (decision.eventId && !dryRun) {
          await flagReview(supabase, decision.eventId, decision.reviewStatus);
        }
        continue;
      }
      if (decision.action === "attach_source") {
        if (!dryRun) await attachSource(supabase, decision.eventId, raw, sourceId);
        summary.attached += 1;
        continue;
      }

      const event = normalizeObservation(raw);
      if (dryRun) {
        summary.created += 1;
        continue;
      }
      const created = await createTournament(supabase, event, raw, sourceId, externalId, decision.publish, source.slugPrefix);
      if (created) {
        summary.created += 1;
        existing.push(toCandidate(created.id, event, raw));
      }
    } catch (error) {
      summary.errors.push(error instanceof Error ? error.message : "Ingest failed for one event.");
    }
  }

  return summary;
}

function externalIdFrom(raw: RawObservation): string | null {
  const match = raw.sourceUrl.match(/\/tournaments\/(\d+)/);
  return match ? match[1] : null;
}

async function ensureSource(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  source: SourceMeta,
): Promise<string | null> {
  const { data: existing } = await supabase.from("sources").select("id").eq("url", source.sourceUrl).maybeSingle();
  if (existing?.id) return existing.id as string;

  const row = {
    kind: "import",
    name: source.sourceName,
    url: source.sourceUrl,
    ingestion: "feed",
    source_type: source.sourceType,
    country_code: source.countryCode?.toUpperCase() ?? null,
    trust_level: source.trustLevel,
    active: true,
  };

  const inserted = await supabase.from("sources").insert(row).select("id").single();
  if (inserted.error || !inserted.data) {
    const fallback = await supabase.from("sources").insert({
      kind: "import",
      name: source.sourceName,
      url: source.sourceUrl,
      ingestion: "feed",
    }).select("id").single();
    return (fallback.data?.id as string) ?? null;
  }
  return inserted.data.id as string;
}

async function loadDuplicateCandidates(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<DuplicateCandidate[]> {
  const rich = await supabase
    .from("tournaments")
    .select("id, name, starts_on, ends_on, city, official_url, registration_url, source_url, source_confidence, public_registration, surface, price_amount, price_currency, is_test, venues(name)")
    .is("archived_at", null)
    .limit(500);
  const plain =
    rich.error && /is_test|source_confidence|price_amount|schema cache/i.test(rich.error.message)
      ? await supabase
          .from("tournaments")
          .select("id, name, starts_on, ends_on, city, official_url, registration_url, source_url, public_registration, surface, venues(name)")
          .is("archived_at", null)
          .limit(500)
      : rich;

  const rows = ((plain.data ?? []) as Record<string, unknown>[]).filter((row) => row.is_test !== true);
  return rows.map((row) => {
    const venue = Array.isArray(row.venues) ? (row.venues[0] as { name?: string } | undefined) : undefined;
    return {
      id: String(row.id),
      title: String(row.name),
      startDate: String(row.starts_on),
      endDate: String(row.ends_on),
      city: row.city ? String(row.city) : null,
      venue: venue?.name ?? null,
      organiser: null,
      officialEventUrl: row.official_url ? String(row.official_url) : null,
      registrationUrl: row.registration_url ? String(row.registration_url) : null,
      sourceUrl: String(row.source_url ?? ""),
      sourceConfidence: (row.source_confidence as DuplicateCandidate["sourceConfidence"]) ?? "medium",
      registrationStatus: (row.public_registration as DuplicateCandidate["registrationStatus"]) ?? "UNKNOWN",
      surface: (row.surface as DuplicateCandidate["surface"]) ?? "unknown",
      priceAmount: typeof row.price_amount === "number" ? row.price_amount : null,
      currency: row.price_currency ? String(row.price_currency) : null,
      sources: [],
    };
  });
}

async function findByExternalId(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  sourceId: string,
  externalId: string,
) {
  const { data } = await supabase
    .from("tournaments")
    .select("id")
    .eq("source_id", sourceId)
    .eq("source_external_id", externalId)
    .maybeSingle();
  return data as { id: string } | null;
}

async function refreshExisting(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  id: string,
  raw: RawObservation,
  sourceId: string,
  slugPrefix: string,
) {
  const event = normalizeObservation(raw);
  const quality = scoreQuality(event);
  const patch = {
    starts_on: event.startDate,
    ends_on: event.endDate,
    city: event.city || undefined,
    timezone: event.timezone || undefined,
    registration_deadline: event.registrationDeadline,
    registration_url: event.registrationUrl,
    official_url: event.officialEventUrl,
    public_registration: event.registrationStatus,
    price_amount: event.priceAmount,
    price_currency: event.currency,
    source_confidence: event.sourceConfidence,
    quality_score: quality.score,
    updated_at: new Date().toISOString(),
  };
  await supabase.from("tournaments").update(patch).eq("id", id);
  await replaceCategories(supabase, id, raw);
  await attachSourceRow(supabase, id, raw, sourceId);
  void slugPrefix;
}

async function attachSource(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  tournamentId: string,
  raw: RawObservation,
  sourceId: string,
) {
  await attachSourceRow(supabase, tournamentId, raw, sourceId);
}

async function attachSourceRow(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  tournamentId: string,
  raw: RawObservation,
  sourceId: string,
) {
  const row = {
    tournament_id: tournamentId,
    source_id: sourceId,
    source_kind: "AGGREGATOR",
    source_name: raw.sourceName,
    source_url: raw.sourceUrl,
    source_confidence: raw.sourceConfidence ?? "high",
    is_primary: false,
  };
  const inserted = await supabase.from("event_sources").upsert(row, { onConflict: "tournament_id,source_url" });
  if (inserted.error && /source_id|source_confidence|schema cache/i.test(inserted.error.message)) {
    await supabase.from("event_sources").upsert(
      {
        tournament_id: tournamentId,
        source_kind: "AGGREGATOR",
        source_name: raw.sourceName,
        source_url: raw.sourceUrl,
        is_primary: false,
      },
      { onConflict: "tournament_id,source_url" },
    );
  }
}

async function flagReview(supabase: ReturnType<typeof createServerSupabaseClient>, id: string, status: ReviewStatus) {
  const updated = await supabase.from("tournaments").update({ review_status: status, updated_at: new Date().toISOString() }).eq("id", id);
  if (updated.error && /review_status|schema cache/i.test(updated.error.message)) return;
}

async function createTournament(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  event: ReturnType<typeof normalizeObservation>,
  raw: RawObservation,
  sourceId: string,
  externalId: string | null,
  publish: boolean,
  slugPrefix: string,
) {
  const country = event.countryCode ?? slugPrefix;
  await ensureCountry(supabase, country);
  const slug = await uniqueSlug(supabase, `${slugPrefix}-tournated-${externalId ?? "event"}-${slugify(event.title)}`);
  const quality = scoreQuality(event);
  const now = new Date().toISOString();
  const row = {
    slug,
    name: event.title,
    country_code: country,
    city: event.city ?? "Unknown",
    starts_on: event.startDate,
    ends_on: event.endDate,
    timezone: event.timezone || (country === "lv" ? "Europe/Riga" : country === "lt" ? "Europe/Vilnius" : "UTC"),
    registration_deadline: event.registrationDeadline,
    registration_status: event.registrationStatus === "OPEN" ? "open" : event.registrationStatus === "CLOSED" ? "closed" : "unknown",
    registration_url: event.registrationUrl,
    official_url: event.officialEventUrl,
    source_id: sourceId,
    source_url: event.sourceUrl,
    source_external_id: externalId,
    surface: event.surface === "unknown" ? "hard" : event.surface,
    environment: event.indoorOutdoor ?? "outdoor",
    event_type: event.eventType,
    event_format: "MULTIPLE",
    duration_type: event.startDate === event.endDate ? "ONE_DAY" : "WEEKEND",
    play_audience: "OPEN_AMATEURS",
    public_registration: event.registrationStatus,
    source_kind: "ORGANISER_WEBSITE",
    dedupe_key: dedupeKey({
      name: event.title,
      startsOn: event.startDate,
      city: event.city ?? "",
      format: "MULTIPLE",
      organizer: event.organiser ?? "",
    }),
    lifecycle_status: "upcoming",
    verification_status: "needs_verification",
    review_status: publish ? "unknown" : "needs_review",
    source_confidence: event.sourceConfidence,
    quality_score: quality.score,
    original_level: event.originalLevel,
    standardised_level: event.standardisedLevel,
    price_amount: event.priceAmount,
    price_currency: event.currency,
    age_group: event.ageGroup,
    event_gender: event.gender,
    published: publish,
    updated_at: now,
  };

  let saved = await supabase.from("tournaments").insert(row).select("id").single();
  if (saved.error && /review_status|source_confidence|quality_score|original_level|standardised_level|price_amount|price_currency|age_group|event_gender|schema cache/i.test(saved.error.message)) {
    const {
      review_status: _a,
      source_confidence: _b,
      quality_score: _c,
      original_level: _d,
      standardised_level: _e,
      price_amount: _f,
      price_currency: _g,
      age_group: _h,
      event_gender: _i,
      ...legacy
    } = row;
    saved = await supabase.from("tournaments").insert(legacy).select("id").single();
  }

  if (saved.error || !saved.data) return null;
  const tournamentId = saved.data.id as string;
  await replaceCategories(supabase, tournamentId, raw);
  await attachSourceRow(supabase, tournamentId, raw, sourceId);
  return { id: tournamentId };
}

async function replaceCategories(supabase: ReturnType<typeof createServerSupabaseClient>, tournamentId: string, raw: RawObservation) {
  if (!raw.ingestCategories?.length) return;
  await supabase.from("tournament_categories").delete().eq("tournament_id", tournamentId);
  const rows = raw.ingestCategories.map((category, index) => ({
    tournament_id: tournamentId,
    discipline: category.discipline,
    gender: category.gender,
    age_label: category.ageLabel,
    entry_fee_amount: category.entryFeeAmount,
    currency: category.currency,
    registration_status: category.registrationStatus,
    level: "recreational",
    sort_order: index,
  }));
  await supabase.from("tournament_categories").insert(rows);
}

async function ensureCountry(supabase: ReturnType<typeof createServerSupabaseClient>, code: string) {
  const normalized = code.toLowerCase();
  const existing = await supabase.from("countries").select("code").eq("code", normalized).maybeSingle();
  if (existing.data) return;
  const row = {
    code: normalized,
    name_en: regionName(normalized, "en"),
    name_lt: regionName(normalized, "lt"),
    region: countryCatalogRegion(normalized),
    priority: 3,
    is_published: true,
  };
  const inserted = await supabase.from("countries").insert(row);
  if (inserted.error && /region|check/i.test(inserted.error.message)) {
    await supabase.from("countries").insert({ ...row, region: "world" });
  }
}

async function uniqueSlug(supabase: ReturnType<typeof createServerSupabaseClient>, base: string): Promise<string> {
  let slug = base.slice(0, 80);
  for (let i = 2; i < 40; i += 1) {
    const { data } = await supabase.from("tournaments").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base.slice(0, 70)}-${i}`;
  }
  return `${base.slice(0, 60)}-${Date.now()}`;
}

function toCandidate(id: string, event: ReturnType<typeof normalizeObservation>, raw: RawObservation): DuplicateCandidate {
  return {
    id,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    city: event.city,
    venue: event.venue,
    organiser: event.organiser,
    officialEventUrl: event.officialEventUrl,
    registrationUrl: event.registrationUrl,
    sourceUrl: raw.sourceUrl,
    sourceConfidence: event.sourceConfidence,
    registrationStatus: event.registrationStatus,
    surface: event.surface,
    priceAmount: event.priceAmount,
    currency: event.currency,
    sources: [{ sourceName: raw.sourceName, sourceUrl: raw.sourceUrl, sourceType: raw.sourceType, sourceConfidence: event.sourceConfidence }],
  };
}
