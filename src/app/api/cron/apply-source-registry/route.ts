import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { applySourceRegistry } from "@/lib/supabase/apply-source-registry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await applySourceRegistry();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registry migration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
