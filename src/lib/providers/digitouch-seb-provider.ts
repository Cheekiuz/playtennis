import { fetchDigitouchSlots } from "@/lib/providers/digitouch-api";
import type { CourtAvailabilityProvider, CourtSlot, FetchSlotsParams } from "@/lib/providers/types";

export class DigitouchSebProvider implements CourtAvailabilityProvider {
  id = "digitouch-scrape";

  async fetchSlots(params: FetchSlotsParams): Promise<CourtSlot[]> {
    const { slots } = await fetchDigitouchSlots(params.clubId, params.date);
    return slots;
  }
}
