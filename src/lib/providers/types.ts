export type CourtSlotStatus = "available" | "booked" | "for_sale";

export interface CourtSlot {
  clubId: string;
  courtId: string;
  courtLabel: string;
  start: string;
  end: string;
  status: CourtSlotStatus;
}

export interface FetchSlotsParams {
  clubId: string;
  date: string;
  sport?: string;
}

export interface CourtAvailabilityProvider {
  id: string;
  fetchSlots(params: FetchSlotsParams): Promise<CourtSlot[]>;
}

export interface SebArenaApiSlot {
  courtId: string;
  courtLabel: string;
  start: string;
  end: string;
  status: CourtSlotStatus;
}

export interface SebArenaApiResponse {
  slots: SebArenaApiSlot[];
}
