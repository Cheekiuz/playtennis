import type { Environment, EventType, Gender, PublicRegistration, Surface } from "@/lib/tournaments/types";

export const SOURCE_TYPES = [
  "federation",
  "tournament_organiser",
  "club",
  "tennis_centre",
  "tournament_platform",
  "public_calendar",
  "social_media",
  "user_submission",
  "other",
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export const STANDARD_LEVELS = ["beginner", "intermediate", "advanced", "open"] as const;
export const REVIEW_STATUSES = ["verified", "checked", "needs_review", "conflicting", "expired", "unknown"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];
export type StandardLevel = (typeof STANDARD_LEVELS)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** One sighting of an event, before it is merged into the public record. */
export type RawObservation = {
  title: string;
  eventType?: string | null;
  startDate: string;
  endDate?: string | null;
  registrationDeadline?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  surface?: string | null;
  indoorOutdoor?: string | null;
  originalLevel?: string | null;
  gender?: string | null;
  ageGroup?: string | null;
  format?: string | null;
  organiser?: string | null;
  organiserUrl?: string | null;
  officialEventUrl?: string | null;
  registrationUrl?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  description?: string | null;
  registrationStatus?: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  sourceConfidence?: Confidence | null;
  isTest?: boolean;
};

export type NormalizedEvent = {
  title: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  venue: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  surface: Surface;
  indoorOutdoor: Environment | null;
  originalLevel: string | null;
  standardisedLevel: StandardLevel | null;
  gender: Gender | null;
  ageGroup: string | null;
  format: string | null;
  organiser: string | null;
  organiserUrl: string | null;
  officialEventUrl: string | null;
  registrationUrl: string | null;
  priceAmount: number | null;
  currency: string | null;
  description: string | null;
  registrationStatus: PublicRegistration;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  sourceConfidence: Confidence;
  isTest: boolean;
};

export type EventSourceRef = {
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  sourceConfidence: Confidence;
};

/** Fields used to decide whether two sightings are the same event. */
export type DuplicateCandidate = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  city: string | null;
  venue: string | null;
  organiser: string | null;
  officialEventUrl: string | null;
  registrationUrl: string | null;
  sourceUrl: string;
  sourceConfidence: Confidence;
  registrationStatus: PublicRegistration;
  surface: Surface;
  priceAmount: number | null;
  currency: string | null;
  sources: EventSourceRef[];
};

export type CanonicalEvent = NormalizedEvent & {
  id: string;
  reviewStatus: ReviewStatus;
  sources: EventSourceRef[];
};

export type FieldConflict = {
  field: string;
  current: string;
  incoming: string;
  preferred: "current" | "incoming";
};

export type Decision =
  | { action: "create"; event: NormalizedEvent; reviewStatus: ReviewStatus; publish: boolean }
  | { action: "attach_source"; eventId: string; reviewStatus: ReviewStatus; conflicts: FieldConflict[] }
  | {
      action: "review";
      eventId: string | null;
      reviewStatus: "needs_review" | "conflicting";
      reason: string;
      conflicts: FieldConflict[];
    }
  | { action: "reject"; reason: string };
