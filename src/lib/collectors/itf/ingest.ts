import { fetchItfMastersCalendar, ITF_SOURCE_ID, ITF_SOURCE_KEY } from "@/lib/collectors/itf/calendar";
import { ingestObservations } from "@/lib/discovery/ingest";
import type { IngestSummary } from "@/lib/discovery/ingest";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ItfIngestResult = IngestSummary & {
  fetched: number;
  skipped: number;
  sourceKey: string;
};

export async function ingestItfMastersCalendar(): Promise<ItfIngestResult> {
  const startedAt = new Date().toISOString();
  const runId = await startIngestRun(ITF_SOURCE_KEY, startedAt);

  const collected = await fetchItfMastersCalendar();
  const summary = await ingestObservations(collected.observations, {
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
    skipped: collected.skipped + summary.rejected,
    error: [...collected.errors, ...summary.errors].slice(0, 5).join("; ") || null,
    details: {
      created: summary.created,
      updated: summary.updated,
      attached: summary.attached,
      review: summary.review,
      rejected: summary.rejected,
    },
  });

  return {
    ...summary,
    fetched: collected.fetched,
    skipped: collected.skipped,
    sourceKey: ITF_SOURCE_KEY,
    errors: [...collected.errors, ...summary.errors],
  };
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
