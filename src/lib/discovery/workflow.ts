import { compareFields } from "@/lib/discovery/conflicts";
import { findDuplicate } from "@/lib/discovery/duplicates";
import { normalizeObservation } from "@/lib/discovery/normalize";
import { scoreQuality } from "@/lib/discovery/quality";
import type { CanonicalEvent, Decision, DuplicateCandidate, NormalizedEvent, RawObservation, ReviewStatus } from "@/lib/discovery/types";

/**
 * Automated discovery, then normalisation, duplicate detection, and validation.
 * Low-confidence sightings stay in review. Nothing here writes to the database.
 */
export function preparePublication(existing: DuplicateCandidate[], raw: RawObservation): Decision {
  const event = normalizeObservation(raw);
  if (!event.title || !event.startDate) {
    return { action: "reject", reason: "A title and start date are required." };
  }

  const match = findDuplicate(existing, event);
  if (!match) return createDecision(event);

  const current = existing.find((item) => item.id === match.eventId);
  if (!current) return createDecision(event);

  if (match.relation === "possible") {
    return {
      action: "review",
      eventId: current.id,
      reviewStatus: "needs_review",
      reason: "Possible duplicate. Confirm the city, date, and organiser before merging.",
      conflicts: [],
    };
  }

  const conflicts = compareFields(current, event);
  if (match.relation === "conflict" || conflicts.length > 0) {
    return {
      action: "review",
      eventId: current.id,
      reviewStatus: "conflicting",
      reason: "Sources disagree. Keep the higher-confidence values and review the rest.",
      conflicts,
    };
  }

  return { action: "attach_source", eventId: current.id, reviewStatus: "unknown", conflicts: [] };
}

export function applyDecision(existing: CanonicalEvent[], raw: RawObservation, decision: Decision): CanonicalEvent[] {
  if (decision.action === "reject" || decision.action === "review") {
    if (decision.action === "review" && decision.eventId) {
      return existing.map((event) =>
        event.id === decision.eventId ? { ...event, reviewStatus: decision.reviewStatus } : event,
      );
    }
    return existing;
  }

  const event = normalizeObservation(raw);
  if (decision.action === "create") {
    return [
      ...existing,
      {
        ...event,
        id: `pending:${event.sourceUrl}`,
        reviewStatus: decision.reviewStatus,
        sources: [sourceOf(event)],
      },
    ];
  }

  return existing.map((current) => {
    if (current.id !== decision.eventId) return current;
    const already = current.sources.some((source) => source.sourceUrl === event.sourceUrl);
    return already ? current : { ...current, sources: [...current.sources, sourceOf(event)] };
  });
}

export function isUpcoming(event: { endDate: string; isTest?: boolean }, today: string): boolean {
  if (event.isTest) return false;
  return event.endDate >= today;
}

function createDecision(event: NormalizedEvent): Decision {
  const quality = scoreQuality(event);
  const publish = !event.isTest && quality.decision === "publish";
  const reviewStatus: ReviewStatus = publish ? "unknown" : "needs_review";
  return { action: "create", event, reviewStatus, publish };
}

function sourceOf(event: NormalizedEvent) {
  return {
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    sourceType: event.sourceType,
    sourceConfidence: event.sourceConfidence,
  };
}
