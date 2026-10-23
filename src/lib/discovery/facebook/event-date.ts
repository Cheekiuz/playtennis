/** Calendar date helpers for Facebook event imports (Europe/Vilnius by default). */

const DEFAULT_TZ = "Europe/Vilnius";

const EN_MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const LT_MONTHS: Record<string, number> = {
  sausio: 1,
  vasario: 2,
  kovo: 3,
  balandzio: 4,
  balandžio: 4,
  geguzes: 5,
  gegužės: 5,
  birzelio: 6,
  birželio: 6,
  liepos: 7,
  rugpjucio: 8,
  rugpjūčio: 8,
  rugsejo: 9,
  rugsėjo: 9,
  spalio: 10,
  lapkricio: 11,
  lapkričio: 11,
  grudzio: 12,
  gruodžio: 12,
};

/**
 * Convert a Facebook/ISO/unix/text value into YYYY-MM-DD.
 * For ISO values with an explicit offset, keep that calendar date (do not shift via UTC).
 * For UTC (Z) values, convert in Europe/Vilnius.
 */
export function toCalendarDate(value: string | undefined, timeZone = DEFAULT_TZ): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

  // Offset form: trust the YYYY-MM-DD written in the string (Facebook local wall time).
  const offsetIso = trimmed.match(/^(\d{4}-\d{2}-\d{2})T[0-9:.]+[+-]\d{2}:?\d{2}$/);
  if (offsetIso) return offsetIso[1];

  const utcIso = trimmed.match(/^(\d{4}-\d{2}-\d{2})T[0-9:.]+Z$/i);
  if (utcIso) {
    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) return formatInTimeZone(new Date(parsed), timeZone);
  }

  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoPrefix) return isoPrefix[1];

  if (/^\d{10}$/.test(trimmed)) {
    return formatInTimeZone(new Date(Number(trimmed) * 1000), timeZone);
  }
  if (/^\d{13}$/.test(trimmed)) {
    return formatInTimeZone(new Date(Number(trimmed)), timeZone);
  }

  const fromText = firstNamedDateInText(trimmed);
  if (fromText) return fromText;

  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return formatInTimeZone(new Date(parsed), timeZone);
}

/**
 * Take the first named month date in reading order.
 * Do NOT pick the earliest upcoming date across the whole page (registration deadlines win that race).
 */
export function extractEventDateFromText(text: string, now = new Date()): string | null {
  return firstNamedDateInText(text, now) ?? firstNumericDateInText(text);
}

export function firstNamedDateInText(text: string, now = new Date()): string | null {
  if (!text) return null;
  const patterns: RegExp[] = [
    /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*|Pirmadienis|Antradienis|Trečiadienis|Ketvirtadienis|Penktadienis|Šeštadienis|Sekmadienis),?\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\b/gi,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\b/gi,
    /\b(20\d{2})\s*m\.?\s*(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})/gi,
    /\b(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})\s*d\.?/gi,
    /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2})(?:,?\s+(20\d{2}))?\b/gi,
  ];

  type Hit = { index: number; date: string };
  const hits: Hit[] = [];
  const yearFallback = Number(text.match(/\b(20\d{2})\b/)?.[1] ?? now.getFullYear());

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const date = dateFromMatch(match, yearFallback);
      if (date) hits.push({ index: match.index ?? 0, date });
    }
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.index - b.index);
  return hits[0]?.date ?? null;
}

function firstNumericDateInText(text: string): string | null {
  const match = text.match(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/);
  if (!match) return null;
  return ymd(Number(match[1]), Number(match[2]), Number(match[3]));
}

function dateFromMatch(match: RegExpMatchArray, yearFallback: number): string {
  const parts = match.slice(1).filter(Boolean);
  if (parts.length === 0) return "";

  // (20xx) month day
  if (/^20\d{2}$/.test(parts[0]) && parts[1] && parts[2]) {
    const month = monthNumber(parts[1]);
    return month ? ymd(Number(parts[0]), month, Number(parts[2])) : "";
  }

  // month day year
  if (monthNumber(parts[0]) && parts[1]) {
    const month = monthNumber(parts[0])!;
    const day = Number(parts[1]);
    const year = parts[2] && /^20\d{2}$/.test(parts[2]) ? Number(parts[2]) : yearFallback;
    return ymd(year, month, day);
  }

  // day month year
  if (/^\d{1,2}$/.test(parts[0]) && monthNumber(parts[1])) {
    const day = Number(parts[0]);
    const month = monthNumber(parts[1])!;
    const year = parts[2] && /^20\d{2}$/.test(parts[2]) ? Number(parts[2]) : yearFallback;
    return ymd(year, month, day);
  }

  return "";
}

function monthNumber(value: string): number | null {
  const key = value.toLowerCase();
  return EN_MONTHS[key] ?? LT_MONTHS[key] ?? null;
}

function ymd(year: number, month: number, day: number): string {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
