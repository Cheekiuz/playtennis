import type {
  CourtAvailabilityProvider,
  CourtSlot,
  FetchSlotsParams,
  SebArenaApiResponse,
} from "@/lib/providers/types";

function getConfig() {
  const baseUrl = process.env.SEB_ARENA_API_BASE_URL?.replace(/\/$/, "");
  const token = process.env.SEB_ARENA_API_TOKEN;
  return { baseUrl, token };
}

export class SebArenaProvider implements CourtAvailabilityProvider {
  id = "seb-arena";

  async fetchSlots(params: FetchSlotsParams): Promise<CourtSlot[]> {
    const { baseUrl, token } = getConfig();

    if (!baseUrl || !token) {
      console.warn(
        "[SebArenaProvider] SEB_ARENA_API_BASE_URL or SEB_ARENA_API_TOKEN not set — skipping fetch",
      );
      return [];
    }

    const url = new URL(`${baseUrl}/availability`);
    url.searchParams.set("club", params.clubId);
    url.searchParams.set("date", params.date);
    if (params.sport) url.searchParams.set("sport", params.sport);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`SEB Arena API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SebArenaApiResponse;

    return (data.slots ?? []).map((slot) => ({
      clubId: params.clubId,
      courtId: slot.courtId,
      courtLabel: slot.courtLabel,
      start: slot.start,
      end: slot.end,
      status: slot.status,
    }));
  }
}
