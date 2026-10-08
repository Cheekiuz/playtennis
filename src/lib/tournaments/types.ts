export const SURFACES = ["clay", "hard", "grass", "carpet", "other", "unknown"] as const;
export const ENVIRONMENTS = ["indoor", "outdoor", "mixed"] as const;
export const AUDIENCES = ["recreational", "masters", "junior", "professional"] as const;
export const DISCIPLINES = ["singles", "doubles", "mixed_doubles"] as const;
export const GENDERS = ["men", "women", "mixed", "open", "boys", "girls"] as const;
export const LEVELS = ["recreational", "club", "competitive", "national"] as const;
export const LIFECYCLE = [
  "upcoming",
  "registration_open",
  "registration_closed",
  "completed",
  "cancelled",
  "postponed",
] as const;
export const REGISTRATION = ["open", "closed", "unknown", "not_required"] as const;
export const TOURNAMENT_TYPES = ["club", "national", "masters", "recreational", "other"] as const;

export type Surface = (typeof SURFACES)[number];
export type Environment = (typeof ENVIRONMENTS)[number];
export type Audience = (typeof AUDIENCES)[number];
export type Discipline = (typeof DISCIPLINES)[number];
export type Gender = (typeof GENDERS)[number];
export type Level = (typeof LEVELS)[number];
export type LifecycleStatus = (typeof LIFECYCLE)[number];
export type RegistrationStatus = (typeof REGISTRATION)[number];

export const EVENT_TYPES = ["TOURNAMENT", "PLAY_SESSION", "MATCH_DAY", "SOCIAL", "CLUB_COMPETITION", "OTHER"] as const;
export const EVENT_FORMATS = ["SINGLES", "MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "MULTIPLE"] as const;
export const DURATION_TYPES = ["ONE_DAY", "WEEKEND", "ONGOING", "LEAGUE"] as const;
export const PLAY_AUDIENCES = ["OPEN_AMATEURS", "CLUB_MEMBERS", "INVITATION_ONLY", "COMPANY", "PROFESSION_SPECIFIC", "JUNIORS"] as const;
export const PUBLIC_REGISTRATION = ["OPEN", "NOT_STARTED", "CLOSED", "FULL", "INVITATION_ONLY", "UNKNOWN"] as const;
export const REGISTRATION_METHODS = ["WEBSITE", "EXTERNAL_FORM", "EMAIL", "PHONE", "FACEBOOK", "OTHER"] as const;
export const PLAY_LEVELS = ["LIGHT", "MIDDLE", "ADVANCED", "NTRP", "OTHER"] as const;
export const SOURCE_KINDS = ["ORGANISER_WEBSITE", "FACEBOOK", "INSTAGRAM", "AGGREGATOR", "MUNICIPALITY", "VENUE", "OTHER"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventFormat = (typeof EVENT_FORMATS)[number];
export type DurationType = (typeof DURATION_TYPES)[number];
export type PlayAudience = (typeof PLAY_AUDIENCES)[number];
export type PublicRegistration = (typeof PUBLIC_REGISTRATION)[number];
export type PlayLevel = (typeof PLAY_LEVELS)[number];

export type TournamentCategory = {
  id: string;
  discipline: Discipline;
  gender: Gender;
  ageMin: number | null;
  ageMax: number | null;
  ageLabel: string | null;
  level: Level;
  rankingRequirement: string | null;
  entryFeeAmount: number | null;
  currency: string | null;
  registrationDeadline: string | null;
  registrationStatus: RegistrationStatus | null;
  sortOrder: number;
};

export type TournamentRecord = {
  id: string;
  slug: string;
  name: string;
  seriesName: string | null;
  organizerName: string | null;
  organizerWebsite: string | null;
  tournamentType: string;
  audience: Audience;
  countryCode: string;
  countryNameEn: string;
  countryNameLt: string;
  region: string | null;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  startsOn: string;
  endsOn: string;
  timezone: string;
  registrationDeadline: string | null;
  registrationStatus: RegistrationStatus;
  registrationUrl: string | null;
  officialUrl: string | null;
  sourceName: string | null;
  sourceUrl: string;
  surface: Surface;
  environment: Environment;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  imageUrl: string | null;
  prizeSummary: string | null;
  lifecycleStatus: LifecycleStatus;
  verificationStatus: "verified" | "needs_verification";
  lastVerifiedAt: string | null;
  published: boolean;
  updatedAt: string;
  eventType: EventType;
  eventFormat: EventFormat;
  durationType: DurationType;
  playAudience: PlayAudience;
  publicRegistration: PublicRegistration;
  startTime: string | null;
  endTime: string | null;
  priceLabel: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  playLevel: PlayLevel | null;
  originalLevel: string | null;
  standardisedLevel: string | null;
  ageGroup: string | null;
  eventGender: Gender | null;
  originalSourceUrl: string | null;
  sourceKind: string | null;
  sourceConfidence: "high" | "medium" | "low" | null;
  reviewStatus: "verified" | "checked" | "needs_review" | "conflicting" | "expired" | "unknown";
  qualityScore: number | null;
  isTest: boolean;
  translations: {
    locale: string;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }[];
  categories: TournamentCategory[];
};

export type TournamentFilters = {
  q?: string;
  country?: string;
  when?: string;
  from?: string;
  to?: string;
  audience?: string;
  surface?: string;
  environment?: string;
  city?: string;
  region?: string;
  age?: string;
  gender?: string;
  discipline?: string;
  level?: string;
  registration?: string;
  event?: string;
  format?: string;
  playLevel?: string;
  page?: number;
};
