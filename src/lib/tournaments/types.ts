export const SURFACES = ["clay", "hard", "grass", "carpet", "other"] as const;
export const ENVIRONMENTS = ["indoor", "outdoor", "mixed"] as const;
export const AUDIENCES = ["recreational", "masters", "junior", "professional"] as const;
export const DISCIPLINES = ["singles", "doubles", "mixed_doubles"] as const;
export const GENDERS = ["men", "women", "mixed", "open"] as const;
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
  age?: string;
  gender?: string;
  discipline?: string;
  level?: string;
  registration?: string;
  page?: number;
};
