import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { ingestAllEnabled, ingestIsEnabled } from "@/lib/discovery/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ingestIsEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "Set INGEST_ENABLED=true (or INGEST_LTS_ENABLED=true) on the deployment.",
    });
  }

  try {
    const results = await ingestAllEnabled();
    const totals = Object.values(results).reduce(
      (acc, item) => ({
        collected: acc.collected + item.collected,
        created: acc.created + item.created,
        updated: acc.updated + item.updated,
        attached: acc.attached + item.attached,
        review: acc.review + item.review,
        rejected: acc.rejected + item.rejected,
        errors: [...acc.errors, ...item.errors],
      }),
      { collected: 0, created: 0, updated: 0, attached: 0, review: 0, rejected: 0, errors: [] as string[] },
    );
    return NextResponse.json({ platforms: results, totals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
