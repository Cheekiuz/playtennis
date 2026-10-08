import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { applyEventSchema } from "@/lib/supabase/apply-event-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await applyEventSchema();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Schema apply failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
