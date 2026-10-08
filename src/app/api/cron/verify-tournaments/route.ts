import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/tournaments/dates";

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

    return NextResponse.json({
      flaggedStale: stale.count,
      flaggedEnded: ended.data?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
