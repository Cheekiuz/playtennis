import type { TournamentRecord } from "@/lib/tournaments/types";

const MAIN_DURATIONS = new Set(["ONE_DAY", "WEEKEND"]);

export function isMainFeed(event: Pick<TournamentRecord, "playAudience" | "eventType" | "publicRegistration" | "durationType" | "endsOn">, today: string): boolean {
  if (event.playAudience !== "OPEN_AMATEURS") return false;
  if (event.eventType !== "TOURNAMENT" && event.eventType !== "PLAY_SESSION") return false;
  if (event.publicRegistration !== "OPEN" && event.publicRegistration !== "NOT_STARTED") return false;
  if (!MAIN_DURATIONS.has(event.durationType)) return false;
  return event.endsOn >= today;
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
