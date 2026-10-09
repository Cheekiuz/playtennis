import type { IngestCategory, NormalizedEvent, RawObservation } from "@/lib/discovery/types";
import { fold } from "@/lib/discovery/text";

const JUNIOR_PATTERNS = [
  /\bu\s?(7|8|9|10|11|12|13|14|15|16|17|18)\b/i,
  /\b(u7|u8|u9|u10|u11|u12|u13|u14|u15|u16|u17|u18)\b/i,
  /\bu\d{1,2}\b/i,
  /\b(7|8|9|10|11|12|13|14|15|16|17|18)\s?m(?:et(?:u|ai)?)?\b/i,
  /\bjaun(?:imas|i|imo)\b/i,
  /\bjunior\b/i,
  /\bvaik(?:ai|ų|ams|u)?\b/i,
  /\bkids?\b/i,
  /\bmoksleiv/i,
  /\b(berniuk|mergait|mergai)/i,
  /\bunder\s*18\b/i,
  /\biki\s*18\b/i,
  /\byounger\s+than\s+18\b/i,
];

const PRO_ONLY = [/\bprofesional/i, /\batp\b/i, /\bwta\b/i, /\bitf pro\b/i];

const TRAINING_CAMP = [/\btreniruo?t(?:ės|es)\b/i, /\btraining camp\b/i, /\bmokym(?:as|ai)\b/i];

const INTERNAL_ONLY = [/\btik klubo nariams\b/i, /\bclub members only\b/i, /\bvidinis renginys\b/i];

const CORPORATE_ONLY = [/\bĮmonių turnyras\b/i, /\bcorporate only\b/i, /\btik darbuotojams\b/i];

const ADULT_AGE_MARKERS = [
  /\bopen\b/i,
  /\b\d{2}\s?\+/,
  /\bsenior/i,
  /\bsuaug/i,
  /\bveteran/i,
  /\bntrp\b/i,
  /\bitn\b/i,
  /\bm\d{1,2}\b/i,
  /\badult/i,
];

export type AdultFilterResult =
  | { action: "include"; visibility: "public" | "closed" | "invitation" }
  | { action: "exclude"; reason: string };

/** Max eligible age from a division label (U18 → 18). Null when not a youth division. */
export function maxAgeFromLabel(label: string | null | undefined): number | null {
  if (!label?.trim()) return null;
  const text = fold(label);

  const compact = text.match(/^u(\d{1,2})$/);
  if (compact) return Number(compact[1]);

  const spaced = text.match(/\bu\s?(\d{1,2})\b/);
  if (spaced) return Number(spaced[1]);

  const under = text.match(/\bunder\s*(\d{1,2})\b/);
  if (under) return Number(under[1]);

  const iki = text.match(/\biki\s*(\d{1,2})\b/);
  if (iki) return Number(iki[1]);

  if (ADULT_AGE_MARKERS.some((pattern) => pattern.test(text))) return null;
  if (JUNIOR_PATTERNS.some((pattern) => pattern.test(text))) {
    const fromPattern = text.match(/\b(\d{1,2})\b/);
    if (fromPattern) return Number(fromPattern[1]);
    return 17;
  }

  return null;
}

export function isJuniorCategoryLabel(label: string | null | undefined): boolean {
  if (!label?.trim()) return false;
  const text = fold(label);
  if (ADULT_AGE_MARKERS.some((pattern) => pattern.test(text))) return false;
  const maxAge = maxAgeFromLabel(label);
  if (maxAge != null && maxAge <= 18) return true;
  return JUNIOR_PATTERNS.some((pattern) => pattern.test(text));
}

export function isJuniorOnlyTournament(raw: RawObservation): boolean {
  if (raw.gender === "boys" || raw.gender === "girls") return true;

  const blob = observationText(raw);
  if (JUNIOR_PATTERNS.some((pattern) => pattern.test(blob))) return true;

  const categories = raw.ingestCategories;
  if (categories?.length) {
    const adultDivisions = categories.filter((row) => !isJuniorCategoryLabel(row.ageLabel));
    return adultDivisions.length === 0;
  }

  if (raw.ageGroup && isJuniorCategoryLabel(raw.ageGroup)) return true;
  return false;
}

export function adultOnlyCategories(categories: IngestCategory[] | undefined): IngestCategory[] | undefined {
  if (!categories?.length) return categories;
  const kept = categories.filter((row) => !isJuniorCategoryLabel(row.ageLabel));
  return kept.length > 0 ? kept : [];
}

export function classifyAdultEvent(event: Pick<
  NormalizedEvent,
  "title" | "ageGroup" | "originalLevel" | "description" | "registrationStatus" | "gender"
>): AdultFilterResult {
  const blob = fold([event.title, event.ageGroup, event.originalLevel, event.description].filter(Boolean).join(" "));

  if (event.gender === "boys" || event.gender === "girls") {
    return { action: "exclude", reason: "junior_only" };
  }
  if (JUNIOR_PATTERNS.some((pattern) => pattern.test(blob))) {
    return { action: "exclude", reason: "junior_only" };
  }
  if (event.ageGroup && isJuniorCategoryLabel(event.ageGroup)) {
    return { action: "exclude", reason: "junior_only" };
  }
  if (PRO_ONLY.some((pattern) => pattern.test(blob))) {
    return { action: "exclude", reason: "professional_only" };
  }
  if (TRAINING_CAMP.some((pattern) => pattern.test(blob)) && !/\bturnyr/i.test(blob)) {
    return { action: "exclude", reason: "training_not_tournament" };
  }
  if (INTERNAL_ONLY.some((pattern) => pattern.test(blob))) {
    return { action: "exclude", reason: "internal_club" };
  }
  if (CORPORATE_ONLY.some((pattern) => pattern.test(blob))) {
    return { action: "exclude", reason: "corporate_only" };
  }

  if (event.registrationStatus === "INVITATION_ONLY") {
    return { action: "include", visibility: "invitation" };
  }
  if (event.registrationStatus === "CLOSED" || event.registrationStatus === "FULL") {
    return { action: "include", visibility: "closed" };
  }
  return { action: "include", visibility: "public" };
}

export function shouldExcludeRaw(raw: RawObservation): string | null {
  return isJuniorOnlyTournament(raw) ? "junior_only" : null;
}

function observationText(raw: RawObservation): string {
  return fold([raw.title, raw.ageGroup, raw.originalLevel, raw.description, raw.format].filter(Boolean).join(" "));
}
