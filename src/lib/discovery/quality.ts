import type { NormalizedEvent } from "@/lib/discovery/types";

export type QualityDecision = "publish" | "review" | "needs_verification";

export type QualityResult = {
  score: number;
  decision: QualityDecision;
};

export function scoreQuality(event: Pick<
  NormalizedEvent,
  | "officialEventUrl"
  | "registrationUrl"
  | "startDate"
  | "city"
  | "countryCode"
  | "organiser"
  | "timezone"
  | "latitude"
  | "longitude"
  | "sourceConfidence"
  | "sourceType"
>): QualityResult {
  let score = 0;
  if (event.officialEventUrl) score += 20;
  if (event.registrationUrl) score += 10;
  if (event.startDate) score += 15;
  if (event.city) score += 10;
  if (event.countryCode) score += 10;
  if (event.organiser) score += 10;
  if (event.timezone) score += 10;
  if (event.latitude != null && event.longitude != null) score += 5;
  if (event.sourceConfidence === "high") score += 15;
  else if (event.sourceConfidence === "medium") score += 8;
  score = Math.min(100, score);

  const discoveryOnly =
    event.sourceConfidence === "low" ||
    event.sourceType === "social_media" ||
    event.sourceType === "user_submission" ||
    event.sourceType === "public_calendar";

  if (discoveryOnly || !event.startDate || !event.city || !event.countryCode || !event.officialEventUrl) {
    return { score, decision: "review" };
  }
  if (score >= 70) return { score, decision: "publish" };
  if (score >= 45) return { score, decision: "needs_verification" };
  return { score, decision: "review" };
}
