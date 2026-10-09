import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/tournaments/dates";
import { isJuniorPublicTournament } from "@/lib/tournaments/junior-exclusion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const today = todayIso();
    const now = new Date().toISOString();

    const stale = await updateRows(
      () =>
        supabase
          .from("tournaments")
          .update({ verification_status: "needs_verification", review_status: "needs_review", updated_at: now })
          .eq("published", true)
          .is("archived_at", null)
          .eq("verification_status", "verified")
          .gte("ends_on", today)
          .lt("last_verified_at", staleBefore)
          .select("id"),
      () =>
        supabase
          .from("tournaments")
          .update({ verification_status: "needs_verification", updated_at: now })
          .eq("published", true)
          .is("archived_at", null)
          .eq("verification_status", "verified")
          .gte("ends_on", today)
          .lt("last_verified_at", staleBefore)
          .select("id"),
    );
    if (stale.error) return NextResponse.json({ error: stale.error }, { status: 500 });

    const ended = await supabase
      .from("tournaments")
      .update({ lifecycle_status: "completed", updated_at: now })
      .eq("published", true)
      .is("archived_at", null)
      .lt("ends_on", today)
      .in("lifecycle_status", ["upcoming", "registration_open"])
      .select("id");

    if (ended.error) return NextResponse.json({ error: ended.error.message }, { status: 500 });

    const unpublishedJunior = await unpublishJuniorTournaments(supabase, now);

    return NextResponse.json({
      flaggedStale: stale.count,
      flaggedEnded: ended.data?.length ?? 0,
      unpublishedJunior,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function unpublishJuniorTournaments(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  now: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, starts_on, audience, play_audience, age_group, event_gender, original_level, tournament_categories (discipline, gender, age_min, age_max, age_label, registration_status, entry_fee_amount, currency, sort_order)",
    )
    .eq("published", true)
    .is("archived_at", null)
    .gte("ends_on", todayIso())
    .limit(500);

  if (error || !data?.length) return 0;

  const ids = data
    .filter((row) =>
      isJuniorPublicTournament({
        name: String(row.name),
        startsOn: String(row.starts_on),
        audience: row.audience === "junior" ? "junior" : "recreational",
        playAudience: row.play_audience === "JUNIORS" ? "JUNIORS" : "OPEN_AMATEURS",
        ageGroup: row.age_group ? String(row.age_group) : null,
        originalLevel: row.original_level ? String(row.original_level) : null,
        eventGender: row.event_gender === "boys" || row.event_gender === "girls" ? row.event_gender : null,
        categories: (row.tournament_categories ?? []).map((category: Record<string, unknown>, index: number) => ({
          id: String(category.id ?? index),
          discipline: (category.discipline as "singles") ?? "singles",
          gender: (category.gender as "open") ?? "open",
          ageMin: typeof category.age_min === "number" ? category.age_min : null,
          ageMax: typeof category.age_max === "number" ? category.age_max : null,
          ageLabel: category.age_label ? String(category.age_label) : null,
          level: "recreational",
          rankingRequirement: null,
          entryFeeAmount: typeof category.entry_fee_amount === "number" ? category.entry_fee_amount : null,
          currency: category.currency ? String(category.currency) : null,
          registrationDeadline: null,
          registrationStatus: null,
          sortOrder: Number(category.sort_order ?? index),
        })),
      }),
    )
    .map((row) => row.id as string);

  if (ids.length === 0) return 0;

  const { data: updated } = await supabase
    .from("tournaments")
    .update({ published: false, updated_at: now })
    .in("id", ids)
    .select("id");

  return updated?.length ?? 0;
}

async function updateRows(
  full: () => PromiseLike<{ data: { id: string }[] | null; error: { message: string } | null }>,
  fallback: () => PromiseLike<{ data: { id: string }[] | null; error: { message: string } | null }>,
): Promise<{ count: number; error: string | null }> {
  const first = await full();
  if (first.error && /review_status|schema cache/i.test(first.error.message)) {
    const second = await fallback();
    return { count: second.data?.length ?? 0, error: second.error?.message ?? null };
  }
  return { count: first.data?.length ?? 0, error: first.error?.message ?? null };
}
