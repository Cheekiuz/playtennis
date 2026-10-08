export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokens(value: string): Set<string> {
  const skip = new Set(["the", "a", "an", "of", "and"]);
  return new Set(fold(value).split(" ").filter((token) => token.length > 1 && !skip.has(token)));
}

export function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }
  return shared / (left.size + right.size - shared);
}

export function canonicalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return null;
  }
}

export function isIanaTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function daysApart(left: string, right: string): number | null {
  const start = Date.parse(`${left.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${right.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.round(Math.abs(start - end) / 86400000);
}

export function samePlace(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return fold(left) === fold(right);
}
