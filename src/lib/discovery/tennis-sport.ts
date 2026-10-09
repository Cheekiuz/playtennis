import { fold } from "@/lib/discovery/text";

/** Table tennis / ping pong (not lawn tennis). */
const TABLE_TENNIS_PATTERNS = [
  /\bstalo\s*tenis/i,
  /\bstalinis\s*tenis/i,
  /\btable\s*tennis/i,
  /\bping[\s-]?pong/i,
  /\bpingpong\b/i,
  /\btt\s*tenis/i,
  /\btenis\s*stalo\b/i,
  /\bteniso\s*stalo\b/i,
];

export function isTableTennisText(...parts: Array<string | null | undefined>): boolean {
  const blob = fold(parts.filter(Boolean).join(" "));
  if (!blob) return false;
  return TABLE_TENNIS_PATTERNS.some((pattern) => pattern.test(blob));
}

export function shouldExcludeTableTennis(raw: {
  title?: string | null;
  description?: string | null;
  venue?: string | null;
  city?: string | null;
}): boolean {
  return isTableTennisText(raw.title, raw.description, raw.venue, raw.city);
}
