import type { Environment, EventType, Gender, PublicRegistration, Surface } from "@/lib/tournaments/types";
import type { Confidence, NormalizedEvent, RawObservation, SourceType, StandardLevel } from "@/lib/discovery/types";
import { isIanaTimezone } from "@/lib/discovery/text";

const LEVELS: Record<string, StandardLevel> = {
  beginner: "beginner",
  light: "beginner",
  intermediate: "intermediate",
  middle: "intermediate",
  advanced: "advanced",
  open: "open",
};

const TYPES: [string, EventType][] = [
  ["club competition", "CLUB_COMPETITION"],
  ["club tournament", "CLUB_COMPETITION"],
  ["match day", "MATCH_DAY"],
  ["matchday", "MATCH_DAY"],
  ["social tennis", "SOCIAL"],
  ["social", "SOCIAL"],
  ["organised play", "PLAY_SESSION"],
  ["organized play", "PLAY_SESSION"],
  ["play session", "PLAY_SESSION"],
  ["round robin", "PLAY_SESSION"],
  ["tournament", "TOURNAMENT"],
];

export function confidenceForSourceType(sourceType: SourceType): Confidence {
  if (sourceType === "federation" || sourceType === "tournament_organiser" || sourceType === "club") return "high";
  if (sourceType === "tennis_centre" || sourceType === "tournament_platform") return "medium";
  return "low";
}

export function standardiseLevel(original: string | null): { originalLevel: string | null; standardisedLevel: StandardLevel | null } {
  if (!original?.trim()) return { originalLevel: null, standardisedLevel: null };
  const wording = original.trim();
  return {
    originalLevel: wording,
    standardisedLevel: LEVELS[wording.toLowerCase()] ?? null,
  };
}

/** A future date is not evidence that registration is open. */
export function registrationFromSource(value: string | null | undefined): PublicRegistration {
  const text = value?.trim().toLowerCase() ?? "";
  if (text === "open") return "OPEN";
  if (text === "coming soon" || text === "not_started" || text === "not started") return "NOT_STARTED";
  if (text === "closed") return "CLOSED";
  if (text === "full") return "FULL";
  if (text === "invitation" || text === "invitation_only" || text === "invitation only") return "INVITATION_ONLY";
  return "UNKNOWN";
}

export function normalizeObservation(raw: RawObservation): NormalizedEvent {
  const title = raw.title.trim();
  const startDate = dateOnly(raw.startDate) ?? "";
  const endDate = dateOnly(raw.endDate) ?? startDate;
  const level = standardiseLevel(raw.originalLevel ?? null);
  const currency = currencyCode(raw.currency);
  const timezone = raw.timezone && isIanaTimezone(raw.timezone) ? raw.timezone : null;

  return {
    title,
    eventType: eventType(raw.eventType, title),
    startDate,
    endDate: endDate >= startDate ? endDate : startDate,
    registrationDeadline: dateOnly(raw.registrationDeadline),
    countryCode: countryCode(raw.countryCode),
    region: clean(raw.region),
    city: clean(raw.city),
    venue: clean(raw.venue),
    address: clean(raw.address),
    latitude: coordinate(raw.latitude, -90, 90),
    longitude: coordinate(raw.longitude, -180, 180),
    timezone,
    surface: surface(raw.surface),
    indoorOutdoor: indoorOutdoor(raw.indoorOutdoor),
    originalLevel: level.originalLevel,
    standardisedLevel: level.standardisedLevel,
    gender: gender(raw.gender),
    ageGroup: clean(raw.ageGroup),
    format: clean(raw.format),
    organiser: clean(raw.organiser),
    organiserUrl: httpUrl(raw.organiserUrl),
    officialEventUrl: httpUrl(raw.officialEventUrl),
    registrationUrl: httpUrl(raw.registrationUrl),
    priceAmount: typeof raw.priceAmount === "number" && Number.isFinite(raw.priceAmount) ? raw.priceAmount : null,
    currency,
    description: clean(raw.description),
    registrationStatus: registrationFromSource(raw.registrationStatus),
    sourceName: raw.sourceName.trim(),
    sourceUrl: raw.sourceUrl.trim(),
    sourceType: raw.sourceType,
    sourceConfidence: raw.sourceConfidence ?? confidenceForSourceType(raw.sourceType),
    isTest: raw.isTest === true,
  };
}

function eventType(value: string | null | undefined, title: string): EventType {
  const explicit = value?.trim().toUpperCase();
  if (
    explicit === "TOURNAMENT" ||
    explicit === "PLAY_SESSION" ||
    explicit === "MATCH_DAY" ||
    explicit === "SOCIAL" ||
    explicit === "CLUB_COMPETITION" ||
    explicit === "OTHER"
  ) {
    return explicit;
  }
  const haystack = `${value ?? ""} ${title}`.toLowerCase();
  for (const [needle, type] of TYPES) {
    if (haystack.includes(needle)) return type;
  }
  return "OTHER";
}

function surface(value: string | null | undefined): Surface {
  const text = value?.trim().toLowerCase() ?? "";
  if (text === "clay" || text === "hard" || text === "grass" || text === "carpet" || text === "other" || text === "unknown") {
    return text;
  }
  return "unknown";
}

function indoorOutdoor(value: string | null | undefined): Environment | null {
  const text = value?.trim().toLowerCase() ?? "";
  if (text === "indoor" || text === "outdoor" || text === "mixed") return text;
  return null;
}

function gender(value: string | null | undefined): Gender | null {
  const text = value?.trim().toLowerCase() ?? "";
  if (text === "open" || text === "men" || text === "women" || text === "mixed" || text === "boys" || text === "girls") return text;
  return null;
}

function countryCode(value: string | null | undefined): string | null {
  const text = value?.trim().toLowerCase() ?? "";
  return /^[a-z]{2}$/.test(text) ? text : null;
}

function currencyCode(value: string | null | undefined): string | null {
  const text = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(text) ? text : null;
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function clean(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function httpUrl(value: string | null | undefined): string | null {
  const text = clean(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function coordinate(value: number | null | undefined, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return null;
  return value;
}
