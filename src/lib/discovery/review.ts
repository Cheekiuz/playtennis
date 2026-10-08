import type { ReviewStatus } from "@/lib/discovery/types";

export function isPubliclyChecked(event: {
  verificationStatus: string;
  reviewStatus: ReviewStatus | string;
  lastVerifiedAt: string | null;
}): boolean {
  if (!event.lastVerifiedAt) return false;
  if (event.reviewStatus === "checked" || event.reviewStatus === "verified") return true;
  if (
    event.reviewStatus === "needs_review" ||
    event.reviewStatus === "conflicting" ||
    event.reviewStatus === "expired" ||
    event.reviewStatus === "unknown"
  ) {
    return event.reviewStatus === "unknown" && event.verificationStatus === "verified";
  }
  return false;
}
