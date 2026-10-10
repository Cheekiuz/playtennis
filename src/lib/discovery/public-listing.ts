import type { NormalizedEvent, ReviewStatus } from "@/lib/discovery/types";
import { scoreQuality } from "@/lib/discovery/quality";

export function hasDiscoveryLocation(event: Pick<NormalizedEvent, "city" | "venue">): boolean {
  return Boolean(event.city?.trim() || event.venue?.trim());
}

/** Whether an ingested discovery row should appear on the public main feed (still may need review). */
export function publicListingDecision(event: NormalizedEvent): { publish: boolean; reviewStatus: ReviewStatus } {
  const quality = scoreQuality(event);
  let publish = !event.isTest && quality.decision === "publish";
  let reviewStatus: ReviewStatus = publish ? "unknown" : "needs_review";

  if (
    !event.isTest &&
    event.sourceType === "social_media" &&
    event.title &&
    event.startDate &&
    hasDiscoveryLocation(event)
  ) {
    return { publish: true, reviewStatus: "needs_review" };
  }

  const websiteSource =
    event.sourceType === "tournament_organiser" ||
    event.sourceType === "club" ||
    event.sourceType === "tennis_centre" ||
    event.sourceType === "tournament_platform";

  if (
    !event.isTest &&
    websiteSource &&
    event.title &&
    event.startDate &&
    event.countryCode &&
    event.officialEventUrl &&
    hasDiscoveryLocation(event)
  ) {
    publish = true;
    reviewStatus = quality.decision === "publish" ? "checked" : "needs_review";
  }

  return { publish, reviewStatus };
}
