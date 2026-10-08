import { EVENT_TYPES, type PublicRegistration, type TournamentRecord } from "@/lib/tournaments/types";

const PUBLIC_TYPES = new Set<string>(EVENT_TYPES);

export function isMainFeed(event: Pick<TournamentRecord, "playAudience" | "eventType" | "endsOn">, today: string): boolean {
  if (event.playAudience !== "OPEN_AMATEURS") return false;
  if (!PUBLIC_TYPES.has(event.eventType)) return false;
  return event.endsOn >= today;
}

export function canStillEnter(status: PublicRegistration): boolean {
  return status === "OPEN" || status === "NOT_STARTED" || status === "UNKNOWN";
}

export function dedupeKey(parts: {
  name: string;
  startsOn: string;
  city: string;
  format: string;
  organizer: string;
}): string {
  return [parts.name, parts.startsOn, parts.city, parts.format, parts.organizer].map(normalize).join("|");
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
