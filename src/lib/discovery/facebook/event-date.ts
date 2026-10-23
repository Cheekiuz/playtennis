/** Calendar date helpers for Facebook event imports (Europe/Vilnius by default). */

const DEFAULT_TZ = "Europe/Vilnius";

const EN_MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
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

export function toCalendarDate(value: string | undefined, timeZone = DEFAULT_TZ): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoPrefix) {
    // Datetimes with Z/offset must use the event timezone, not UTC slice.
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) return formatInTimeZone(new Date(parsed), timeZone);
    }
    return isoPrefix[1];
  }

  if (/^\d{10}$/.test(trimmed)) {
    return formatInTimeZone(new Date(Number(trimmed) * 1000), timeZone);
  }
  if (/^\d{13}$/.test(trimmed)) {
    return formatInTimeZone(new Date(Number(trimmed)), timeZone);
  }

  const fromText = parseTextualDate(trimmed);
  if (fromText) return fromText;

  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return formatInTimeZone(new Date(parsed), timeZone);
}

/** Pull the best event date from a Facebook event page text blob (main column only). */
export function extractEventDateFromText(text: string, now = new Date()): string | null {
  if (!text) return null;
  const named: string[] = [];
  const numeric: string[] = [];

  const en = text.matchAll(
    /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+)?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi,
  );
  for (const m of en) {
    const month = EN_MONTHS[m[2].toLowerCase()];
    if (month) named.push(ymd(Number(m[3]), month, Number(m[1])));
  }

  const enAlt = text.matchAll(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi,
  );
  for (const m of enAlt) {
    const month = EN_MONTHS[m[1].toLowerCase()];
    if (month) named.push(ymd(Number(m[3]), month, Number(m[2])));
  }

  const lt = text.matchAll(
    /\b(20\d{2})\s*m\.?\s*(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})/gi,
  );
  for (const m of lt) {
    const month = LT_MONTHS[m[2].toLowerCase()] ?? LT_MONTHS[m[2]];
    if (month) named.push(ymd(Number(m[1]), month, Number(m[3])));
  }

  const ltShort = text.matchAll(
    /\b(sausio|vasario|kovo|balandžio|balandzio|gegužės|geguzes|birželio|birzelio|liepos|rugpjūčio|rugpjucio|rugsėjo|rugsejo|spalio|lapkričio|lapkricio|gruodžio|grudzio)\s+(\d{1,2})\s*d\.?/gi,
  );
  const yearHint = text.match(/\b(20\d{2})\b/);
  const year = yearHint ? Number(yearHint[1]) : now.getFullYear();
  for (const m of ltShort) {
    const month = LT_MONTHS[m[1].toLowerCase()] ?? LT_MONTHS[m[1]];
    if (month) named.push(ymd(year, month, Number(m[2])));
  }

  // Numeric dates only as a last resort. Random YYYY-MM-DD values on Facebook pages are often unrelated.
  const numericMatches = text.matchAll(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/g);
  for (const m of numericMatches) {
    numeric.push(ymd(Number(m[1]), Number(m[2]), Number(m[3])));
  }

  const today = formatInTimeZone(now, DEFAULT_TZ);
  const pick = (values: string[]) => {
    const unique = [...new Set(values.filter(Boolean))];
    if (unique.length === 0) return null;
    const upcoming = unique.filter((d) => d >= today).sort();
    if (upcoming.length > 0) return upcoming[0];
    return unique.sort().at(-1) ?? null;
  };

  return pick(named) ?? pick(numeric);
}

function parseTextualDate(trimmed: string): string | null {
  return extractEventDateFromText(trimmed);
}

function ymd(year: number, month: number, day: number): string {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
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
