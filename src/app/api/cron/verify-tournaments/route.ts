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

    const { data: stale, error: staleError } = await supabase
      .from("tournaments")
      .update({ verification_status: "needs_verification", updated_at: new Date().toISOString() })
      .eq("published", true)
      .is("archived_at", null)
      .eq("verification_status", "verified")
      .lt("last_verified_at", staleBefore)
      .select("id");

    if (staleError) {
      return NextResponse.json({ error: staleError.message }, { status: 500 });
    }

    const { data: ended, error: endedError } = await supabase
      .from("tournaments")
      .update({ verification_status: "needs_verification", updated_at: new Date().toISOString() })
      .eq("published", true)
      .is("archived_at", null)
      .lt("ends_on", today)
      .in("lifecycle_status", ["upcoming", "registration_open"])
      .select("id");

    if (endedError) {
      return NextResponse.json({ error: endedError.message }, { status: 500 });
    }

    return NextResponse.json({
      flaggedStale: stale?.length ?? 0,
      flaggedEnded: ended?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
