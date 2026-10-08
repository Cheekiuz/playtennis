import type { NormalizedEvent } from "@/lib/discovery/types";

export type QualityDecision = "publish" | "review" | "needs_verification";

export type QualityResult = {
  score: number;
  decision: QualityDecision;
};

export function scoreQuality(event: Pick<
  NormalizedEvent,
  | "title"
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

  if (event.sourceType === "social_media") {
    if (!event.startDate || !event.title) return { score, decision: "review" };
    if (event.city && event.countryCode) {
      return { score, decision: score >= 50 ? "needs_verification" : "review" };
    }
    return { score, decision: "review" };
  }

  const discoveryOnly =
    event.sourceConfidence === "low" ||
    event.sourceType === "user_submission" ||
    event.sourceType === "public_calendar";

  if (discoveryOnly || !event.startDate || !event.city || !event.countryCode || !event.officialEventUrl) {
    return { score, decision: "review" };
  }
  if (score >= 70) return { score, decision: "publish" };
  if (score >= 45) return { score, decision: "needs_verification" };
  return { score, decision: "review" };
}
