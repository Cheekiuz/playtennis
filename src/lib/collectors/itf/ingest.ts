import { fetchItfMastersCalendar, ITF_SOURCE_ID, ITF_SOURCE_KEY } from "@/lib/collectors/itf/calendar";
import { ingestObservations } from "@/lib/discovery/ingest";
import type { IngestSummary } from "@/lib/discovery/ingest";
import type { RawObservation } from "@/lib/discovery/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/tournaments/dates";

export type ItfIngestOptions = {
  /** Skip this many mapped observations after date filtering. */
  offset?: number;
  /** Max observations to upsert in this run (keeps under Vercel timeout). */
  limit?: number;
  /** Include ended events from this many days ago (for Past tab). Default 120. */
  pastDays?: number;
};

export type ItfIngestResult = IngestSummary & {
  fetched: number;
  skipped: number;
  sourceKey: string;
  offset: number;
  limit: number;
  batchSize: number;
  remaining: number;
  nextOffset: number | null;
};

export async function ingestItfMastersCalendar(options: ItfIngestOptions = {}): Promise<ItfIngestResult> {
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.min(150, Math.max(1, options.limit ?? 75));
  const pastDays = options.pastDays ?? 120;
  const startedAt = new Date().toISOString();
  const runId = await startIngestRun(ITF_SOURCE_KEY, startedAt);

  const collected = await fetchItfMastersCalendar();
  const windowed = filterItfWindow(collected.observations, pastDays);
  const batch = windowed.slice(offset, offset + limit);
  const remaining = Math.max(0, windowed.length - offset - batch.length);
  const nextOffset = remaining > 0 ? offset + batch.length : null;

  const summary = await ingestObservations(batch, {
    sourceKey: ITF_SOURCE_KEY,
    sourceId: ITF_SOURCE_ID,
    sourceName: "ITF World Tennis Masters Tour calendar",
    sourceUrl: "https://www.itftennis.com/en/tournament-calendar/world-tennis-masters-tour-calendar/",
    sourceType: "public_calendar",
    trustLevel: "high",
    countryCode: null,
    slugPrefix: "itf",
  });

  const upserted = summary.created + summary.updated + summary.attached;
  const status =
    collected.errors.length > 0 || summary.errors.length > 0
      ? upserted > 0
        ? "partial"
        : "failed"
      : "success";

  await finishIngestRun(runId, {
    status,
    fetched: collected.fetched,
    upserted,
    skipped: collected.skipped + summary.rejected + (windowed.length - batch.length),
    error: [...collected.errors, ...summary.errors].slice(0, 5).join("; ") || null,
    details: {
      created: summary.created,
      updated: summary.updated,
      attached: summary.attached,
      review: summary.review,
      rejected: summary.rejected,
      windowed: windowed.length,
      offset,
      limit,
      batchSize: batch.length,
      nextOffset,
    },
  });

  return {
    ...summary,
    fetched: collected.fetched,
    skipped: collected.skipped,
    sourceKey: ITF_SOURCE_KEY,
    offset,
    limit,
    batchSize: batch.length,
    remaining,
    nextOffset,
    errors: [...collected.errors, ...summary.errors],
  };
}

function filterItfWindow(observations: RawObservation[], pastDays: number): RawObservation[] {
  const today = todayIso();
  const pastCutoff = shiftIsoDays(today, -pastDays);
  return observations
    .filter((row) => {
      const end = row.endDate || row.startDate;
      return end >= pastCutoff;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function shiftIsoDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function startIngestRun(sourceKey: string, startedAt: string): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ingest_runs")
      .insert({ source_key: sourceKey, started_at: startedAt, status: "running" })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

async function finishIngestRun(
  runId: string | null,
  patch: {
    status: string;
    fetched: number;
    upserted: number;
    skipped: number;
    error: string | null;
    details: Record<string, unknown>;
  },
) {
  if (!runId) return;
  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from("ingest_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: patch.status,
        fetched: patch.fetched,
        upserted: patch.upserted,
        skipped: patch.skipped,
        error: patch.error,
        details: patch.details,
      })
      .eq("id", runId);
  } catch {
    // Schema may not be applied yet.
  }
}
