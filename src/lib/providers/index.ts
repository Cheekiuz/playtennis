import { DigitouchSebProvider } from "@/lib/providers/digitouch-seb-provider";
import { MockSebArenaProvider } from "@/lib/providers/mock-seb-arena-provider";
import { SebArenaProvider } from "@/lib/providers/seb-arena-provider";
import type { CourtAvailabilityProvider } from "@/lib/providers/types";

export type ProviderId = "mock" | "scrape" | "seb";

export function getCourtAvailabilityProvider(): CourtAvailabilityProvider {
  const configured = process.env.SEB_ARENA_PROVIDER as ProviderId | undefined;

  if (configured === "mock") {
    return new MockSebArenaProvider();
  }

  if (configured === "scrape") {
    return new DigitouchSebProvider();
  }

  if (configured === "seb") {
    return new SebArenaProvider();
  }

  if (process.env.NODE_ENV === "development") {
    return new MockSebArenaProvider();
  }

  return new DigitouchSebProvider();
}

export { DigitouchSebProvider, MockSebArenaProvider, SebArenaProvider };
export type { CourtAvailabilityProvider, CourtSlot, CourtSlotStatus, FetchSlotsParams } from "@/lib/providers/types";
