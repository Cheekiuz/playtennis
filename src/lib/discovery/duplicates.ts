import type { DuplicateCandidate, NormalizedEvent } from "@/lib/discovery/types";
import { canonicalUrl, daysApart, fold, jaccard, samePlace, tokens } from "@/lib/discovery/text";

export type DuplicateMatch = {
  eventId: string;
  relation: "duplicate" | "conflict" | "possible";
  reasons: string[];
};

export function findDuplicate(existing: DuplicateCandidate[], incoming: NormalizedEvent): DuplicateMatch | null {
  const incomingUrls = urlsOf(incoming.officialEventUrl, incoming.registrationUrl, incoming.sourceUrl);
  let possible: DuplicateMatch | null = null;

  for (const event of existing) {
    const knownUrls = new Set(event.sources.map((source) => canonicalUrl(source.sourceUrl)).filter((url): url is string => Boolean(url)));
    for (const url of [event.officialEventUrl, event.registrationUrl, event.sourceUrl]) {
      const canonical = canonicalUrl(url);
      if (canonical) knownUrls.add(canonical);
    }
    if ([...incomingUrls].some((url) => knownUrls.has(url))) {
      return { eventId: event.id, relation: "duplicate", reasons: ["official URL"] };
    }

    const title = jaccard(tokens(event.title), tokens(incoming.title));
    if (title < 0.45) continue;
    if (!samePlace(event.city, incoming.city)) continue;

    const days = daysApart(event.startDate, incoming.startDate);
    if (days == null || days > 1) continue;

    const organiser = similarText(event.organiser, incoming.organiser);
    const venue = samePlace(event.venue, incoming.venue);
    const reasons = ["title", "city", days === 0 ? "same date" : "date off by one day"];
    if (organiser) reasons.push("organiser");
    if (venue) reasons.push("venue");

    if (days === 1 && (organiser || venue || title >= 0.6)) {
      return { eventId: event.id, relation: "conflict", reasons };
    }
    if (days === 0 && (organiser || venue || title >= 0.75)) {
      return { eventId: event.id, relation: "duplicate", reasons };
    }
    if (!possible) possible = { eventId: event.id, relation: "possible", reasons };
  }

  return possible;
}

function urlsOf(...values: (string | null)[]): Set<string> {
  return new Set(values.map((value) => canonicalUrl(value)).filter((url): url is string => Boolean(url)));
}

function similarText(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  const a = fold(left);
  const b = fold(right);
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return jaccard(tokens(left), tokens(right)) >= 0.5;
}
