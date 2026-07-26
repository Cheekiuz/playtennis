import {
  loadSnapshotsFromDb,
  upsertAvailabilitySnapshots,
} from "@/lib/court-availability-service";
import { fetchDigitouchSlots } from "@/lib/providers/digitouch-api";
import { getCourtAvailabilityProvider } from "@/lib/providers";
import type { CourtSlot } from "@/lib/providers/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CLUBS = new Set(["seb-arena", "seb-bernardinai"]);
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const rateBuckets = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) {
    rateBuckets.set(ip, bucket);
    return true;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return false;
}

async function fetchLiveSlots(club: string, date: string): Promise<{
  slots: CourtSlot[];
  source: "live" | "cache" | "stale";
  provider: string;
}> {
  const provider = getCourtAvailabilityProvider();

  if (provider.id === "digitouch-scrape") {
    try {
      const { slots, fromCache } = await fetchDigitouchSlots(club, date);
      if (slots.length > 0) {
        await upsertAvailabilitySnapshots(slots);
        return { slots, source: fromCache ? "cache" : "live", provider: provider.id };
      }
    } catch {
      // fall through to stale snapshots
    }
  }

  try {
    const slots = await provider.fetchSlots({ clubId: club, date, sport: "tenisas" });
    if (slots.length > 0) {
      await upsertAvailabilitySnapshots(slots);
      return { slots, source: "live", provider: provider.id };
    }
  } catch {
    // fall through
  }

  const stale = await loadSnapshotsFromDb(club, date);
  return { slots: stale, source: "stale", provider: provider.id };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const club = searchParams.get("club") ?? "";
  const date = searchParams.get("date") ?? "";

  if (!VALID_CLUBS.has(club)) {
    return Response.json({ error: "Invalid club" }, { status: 400 });
  }

  if (!DATE_RE.test(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const { slots, source, provider } = await fetchLiveSlots(club, date);
    return Response.json({
      slots,
      fetchedAt: new Date().toISOString(),
      source,
      provider,
      demo: provider === "mock-seb-arena",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch availability";
    return Response.json({ error: message }, { status: 500 });
  }
}
