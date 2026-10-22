import { NextResponse } from "next/server";
import { ingestItfMastersCalendar } from "@/lib/collectors/itf/ingest";
import { isCronAuthorized } from "@/lib/cron-auth";
import { discoveryIsEnabled, runRegistryDiscovery } from "@/lib/discovery/discover";
import { ingestAllEnabled, ingestIsEnabled } from "@/lib/discovery/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const federationEnabled = ingestIsEnabled();
  const registryEnabled = discoveryIsEnabled();
  const itfEnabled = process.env.INGEST_ITF_ENABLED === "true" || federationEnabled;

  // GitHub Actions cron is trusted: always sync registry sources (LT websites, Facebook, etc.).
  const runRegistry = registryEnabled || federationEnabled;

  if (!runRegistry && !federationEnabled && !itfEnabled) {
    return NextResponse.json({
      skipped: true,
      reason: "Set INGEST_ENABLED=true (or INGEST_ITF_ENABLED=true) on the deployment.",
    });
  }

  try {
    const payload: Record<string, unknown> = {};

    if (runRegistry) {
      payload.registry = await runRegistryDiscovery();
    }

    // LTS/LV-only flag: still pull federation calendars when full registry ingest is off.
    if (federationEnabled && !registryEnabled) {
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
      payload.federation = { platforms: results, totals };
    }

    if (itfEnabled) {
      // Batched: full calendar is continued by the dedicated ingest-itf workflow.
      payload.itf = await ingestItfMastersCalendar({ offset: 0, limit: 75 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
