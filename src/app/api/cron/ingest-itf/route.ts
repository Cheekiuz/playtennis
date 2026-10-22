import { NextResponse } from "next/server";
import { ingestItfMastersCalendar } from "@/lib/collectors/itf/ingest";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.INGEST_ENABLED !== "true" && process.env.INGEST_ITF_ENABLED !== "true") {
    return NextResponse.json({
      skipped: true,
      reason: "Set INGEST_ENABLED=true or INGEST_ITF_ENABLED=true to sync the ITF Masters calendar.",
    });
  }

  try {
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "75");
    const result = await ingestItfMastersCalendar({
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 75,
    });
    return NextResponse.json({ itf: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ITF ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
