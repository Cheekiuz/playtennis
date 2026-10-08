import type { NormalizedEvent, RawObservation } from "@/lib/discovery/types";
import { fold } from "@/lib/discovery/text";

const JUNIOR_PATTERNS = [
  /\bu\s?(7|8|9|10|12|14|16|18)\b/i,
  /\b(u7|u8|u9|u10|u12|u14|u16|u18)\b/i,
  /\b(7|8|9|10|12|14|16|18)\s?m(?:et(?:u|ai)?)?\b/i,
  /\bjaun(?:imas|i)\b/i,
  /\bjunior\b/i,
  /\bvaik(?:ai|ų|ams)?\b/i,
  /\bkids?\b/i,
];

const PRO_ONLY = [/\bprofesional/i, /\batp\b/i, /\bwta\b/i, /\bitf pro\b/i];

const TRAINING_CAMP = [/\btreniruo?t(?:ės|es)\b/i, /\btraining camp\b/i, /\bmokym(?:as|ai)\b/i];

const INTERNAL_ONLY = [/\btik klubo nariams\b/i, /\bclub members only\b/i, /\bvidinis renginys\b/i];

const CORPORATE_ONLY = [/\bĮmonių turnyras\b/i, /\bcorporate only\b/i, /\btik darbuotojams\b/i];

export type AdultFilterResult =
  | { action: "include"; visibility: "public" | "closed" | "invitation" }
  | { action: "exclude"; reason: string };

export function classifyAdultEvent(event: Pick<
  NormalizedEvent,
  "title" | "ageGroup" | "originalLevel" | "description" | "registrationStatus"
>): AdultFilterResult {
  const blob = fold([event.title, event.ageGroup, event.originalLevel, event.description].filter(Boolean).join(" "));

  if (JUNIOR_PATTERNS.some((pattern) => pattern.test(blob))) {
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
  const title = raw.title ?? "";
  const blob = fold([title, raw.ageGroup, raw.originalLevel, raw.description, raw.format].filter(Boolean).join(" "));
  if (JUNIOR_PATTERNS.some((pattern) => pattern.test(blob))) return "junior_only";
  return null;
}
