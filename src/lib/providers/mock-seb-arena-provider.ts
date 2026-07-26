import type { CourtAvailabilityProvider, CourtSlot, FetchSlotsParams } from "@/lib/providers/types";
import { SEB_ARENA_INDOOR_COURTS } from "@/lib/court-alerts-config";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class MockSebArenaProvider implements CourtAvailabilityProvider {
  id = "mock-seb-arena";

  async fetchSlots(params: FetchSlotsParams): Promise<CourtSlot[]> {
    const { clubId, date } = params;
    const seed = hashString(`${clubId}:${date}`);
    const slots: CourtSlot[] = [];

    const hours = [17, 18, 19, 20];
    for (let i = 0; i < 3; i++) {
      const court = SEB_ARENA_INDOOR_COURTS[(seed + i) % SEB_ARENA_INDOOR_COURTS.length];
      const hour = hours[(seed + i) % hours.length];
      const start = `${date}T${String(hour).padStart(2, "0")}:00:00+03:00`;
      const end = `${date}T${String(hour + 1).padStart(2, "0")}:00:00+03:00`;

      slots.push({
        clubId,
        courtId: court.id,
        courtLabel: court.label,
        start,
        end,
        status: i === 0 ? "available" : i === 1 ? "for_sale" : "booked",
      });
    }

    return slots;
  }
}
