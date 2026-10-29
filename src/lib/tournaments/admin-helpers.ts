import type { TournamentRecord } from "@/lib/tournaments/types";

export function needsAdminReview(tournament: TournamentRecord): boolean {
  return tournament.reviewStatus === "needs_review" || tournament.verificationStatus === "needs_verification";
}

export function adminSourceLabel(tournament: TournamentRecord): string {
  return tournament.sourceName?.trim() || tournament.sourceKind?.trim() || "Unknown";
}
