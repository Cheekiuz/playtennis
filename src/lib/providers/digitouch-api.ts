import type { CourtSlot, CourtSlotStatus } from "@/lib/providers/types";

const API_BASE = "https://ws.tenisopasaulis.lt/api";
const DEFAULT_SALE_POINT = 11;
const CACHE_TTL_MS = 30_000;

export const CLUB_PLACE_IDS: Record<string, number[]> = {
  "seb-arena": [2, 8, 18],
  "seb-bernardinai": [5, 20],
};

interface TimetableEntry {
  from: string;
  to: string;
  status: string;
}

interface PlaceInfoCourt {
  courtID: number;
  courtName?: string;
  date: string;
  timetable: Record<string, TimetableEntry>;
}

interface PlaceInfoBatchBlock {
  place: number;
  data: PlaceInfoCourt[][];
}

interface PlaceInfoBatchResponse {
  status: string;
  data?: PlaceInfoBatchBlock[];
}

interface AllPlacesInfoResponse {
  status: string;
  data?: { id: number; placeName: string }[];
}

const cache = new Map<string, { expiresAt: number; slots: CourtSlot[] }>();

function getSalePoint(): number {
  const raw = process.env.SEB_ARENA_SALE_POINT;
  if (!raw) return DEFAULT_SALE_POINT;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_SALE_POINT;
}

function mapStatus(raw: string): CourtSlotStatus {
  if (raw === "free") return "available";
  if (raw === "fullsell" || raw === "mysell") return "for_sale";
  return "booked";
}

/** Map Digitouch courtName to PlayTennis short court ID. */
export function normalizeCourtId(courtName: string | undefined, courtId: number): string {
  if (!courtName) return String(courtId);

  const trimmed = courtName.trim();
  if (/^K\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed.includes("Centrinis") || trimmed.includes("(CC)")) return "C";

  const seb = trimmed.match(/SEB\s+(\d+)/i);
  if (seb) return String(parseInt(seb[1], 10));

  const bs = trimmed.match(/BS\s+(\d+)/i);
  if (bs) return String(parseInt(bs[1], 10));

  return trimmed;
}

function slotKey(clubId: string, date: string): string {
  return `${clubId}:${date}`;
}

function parseSlotsFromBatch(
  clubId: string,
  date: string,
  blocks: PlaceInfoBatchBlock[],
): CourtSlot[] {
  const slots: CourtSlot[] = [];

  for (const block of blocks) {
    for (const courtGroup of block.data ?? []) {
      for (const court of courtGroup) {
        const courtLabel = normalizeCourtId(court.courtName, court.courtID);

        for (const entry of Object.values(court.timetable ?? {})) {
          slots.push({
            clubId,
            courtId: courtLabel,
            courtLabel,
            start: `${date}T${entry.from}+03:00`,
            end: `${date}T${entry.to}+03:00`,
            status: mapStatus(entry.status),
          });
        }
      }
    }
  }

  return slots;
}

async function fetchPlaceInfoBatch(
  placeIds: number[],
  date: string,
  sessionToken: string,
): Promise<PlaceInfoBatchBlock[]> {
  const res = await fetch(`${API_BASE}/v1/placeInfoBatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      excludeCourtName: false,
      excludeInfoUrl: true,
      places: placeIds,
      dates: [date],
      salePoint: getSalePoint(),
      sessionToken,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Digitouch placeInfoBatch failed: ${res.status}`);
  }

  const data = (await res.json()) as PlaceInfoBatchResponse;
  if (data.status !== "success" || !data.data) {
    throw new Error("Digitouch placeInfoBatch returned no data");
  }

  return data.data;
}

export async function loginOptional(): Promise<string> {
  const username = process.env.SEB_ARENA_BOOKING_USERNAME;
  const password = process.env.SEB_ARENA_BOOKING_PASSWORD;
  if (!username || !password) return "";

  const form = new FormData();
  form.append("username", username);
  form.append("password", password);

  const res = await fetch(`${API_BASE}/v1/login`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return "";

  const json = (await res.json()) as {
    status?: string;
    data?: { session_token?: string };
  };

  return json.status === "success" ? (json.data?.session_token ?? "") : "";
}

export async function fetchDigitouchSlots(
  clubId: string,
  date: string,
  options?: { bypassCache?: boolean },
): Promise<{ slots: CourtSlot[]; fromCache: boolean }> {
  const key = slotKey(clubId, date);
  const cached = cache.get(key);
  if (!options?.bypassCache && cached && cached.expiresAt > Date.now()) {
    return { slots: cached.slots, fromCache: true };
  }

  const placeIds = CLUB_PLACE_IDS[clubId];
  if (!placeIds?.length) {
    return { slots: [], fromCache: false };
  }

  const sessionToken = await loginOptional();
  const blocks = await fetchPlaceInfoBatch(placeIds, date, sessionToken);
  const slots = parseSlotsFromBatch(clubId, date, blocks);

  cache.set(key, { slots, expiresAt: Date.now() + CACHE_TTL_MS });
  return { slots, fromCache: false };
}

export async function fetchAllPlacesInfo(): Promise<AllPlacesInfoResponse["data"]> {
  const res = await fetch(`${API_BASE}/v1/allPlacesInfo`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error("Failed to fetch allPlacesInfo");
  const json = (await res.json()) as AllPlacesInfoResponse;
  return json.data ?? [];
}

export function clearDigitouchCache(): void {
  cache.clear();
}
