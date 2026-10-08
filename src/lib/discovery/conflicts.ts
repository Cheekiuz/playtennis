import type { Confidence, DuplicateCandidate, FieldConflict, NormalizedEvent } from "@/lib/discovery/types";

const RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

export function compareFields(current: DuplicateCandidate, incoming: NormalizedEvent): FieldConflict[] {
  const preferIncoming = RANK[incoming.sourceConfidence] > RANK[current.sourceConfidence];
  const conflicts: FieldConflict[] = [];
  consider(conflicts, "startDate", current.startDate, incoming.startDate, preferIncoming);
  consider(conflicts, "endDate", current.endDate, incoming.endDate, preferIncoming);
  consider(conflicts, "city", current.city, incoming.city, preferIncoming);
  consider(conflicts, "venue", current.venue, incoming.venue, preferIncoming);
  consider(conflicts, "surface", current.surface, incoming.surface === "unknown" ? null : incoming.surface, preferIncoming);
  consider(conflicts, "currency", current.currency, incoming.currency, preferIncoming);
  consider(
    conflicts,
    "priceAmount",
    current.priceAmount == null ? null : String(current.priceAmount),
    incoming.priceAmount == null ? null : String(incoming.priceAmount),
    preferIncoming,
  );
  if (current.registrationStatus !== "UNKNOWN" && incoming.registrationStatus !== "UNKNOWN") {
    consider(conflicts, "registrationStatus", current.registrationStatus, incoming.registrationStatus, preferIncoming);
  }
  return conflicts;
}

function consider(conflicts: FieldConflict[], field: string, current: string | null, incoming: string | null, preferIncoming: boolean): void {
  if (!current || !incoming || current === incoming) return;
  conflicts.push({
    field,
    current,
    incoming,
    preferred: preferIncoming ? "incoming" : "current",
  });
}
