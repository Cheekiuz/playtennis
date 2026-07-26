import { MockSebArenaProvider } from "@/lib/providers/mock-seb-arena-provider";
import { SebArenaProvider } from "@/lib/providers/seb-arena-provider";
import type { CourtAvailabilityProvider } from "@/lib/providers/types";

export type ProviderId = "mock" | "seb";

export function getCourtAvailabilityProvider(): CourtAvailabilityProvider {
  const configured = process.env.SEB_ARENA_PROVIDER as ProviderId | undefined;

  if (configured === "seb") {
    return new SebArenaProvider();
  }

  if (configured === "mock" || process.env.NODE_ENV === "development") {
    return new MockSebArenaProvider();
  }

  return new SebArenaProvider();
}

export { MockSebArenaProvider, SebArenaProvider };
export type { CourtAvailabilityProvider, CourtSlot, CourtSlotStatus, FetchSlotsParams } from "@/lib/providers/types";
