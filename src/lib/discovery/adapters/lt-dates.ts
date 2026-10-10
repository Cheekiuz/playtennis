const LT_MONTHS: Record<string, number> = {
  sausio: 1,
  vasario: 2,
  kovo: 3,
  balandžio: 4,
  gegužės: 5,
  birželio: 6,
  liepos: 7,
  rugpjūčio: 8,
  rugsėjo: 9,
  spalio: 10,
  lapkričio: 11,
  gruodžio: 12,
};

/** Parse common Lithuanian date fragments from organizer pages (e.g. TennisPassion headings). */
export function parseLtHeadingDates(text: string): { startDate: string; endDate: string } | null {
  const normalized = text.replace(/\u2019/g, "'").trim();

  const namedMonth = normalized.match(/(20\d{2})\s+([a-ząčęėįšųūž]+)\s+(\d{1,2})/i);
  if (namedMonth) {
    const year = Number(namedMonth[1]);
    const monthKey = namedMonth[2].toLowerCase();
    const month = LT_MONTHS[monthKey];
    const day = Number(namedMonth[3]);
    if (month && day >= 1 && day <= 31) {
      const iso = toIsoDate(year, month, day);
      return iso ? { startDate: iso, endDate: iso } : null;
    }
  }

  const numeric = normalized.match(/(20\d{2})\s+(\d{1,2})\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/);
  if (numeric) {
    const year = Number(numeric[1]);
    const month = Number(numeric[2]);
    const startDay = Number(numeric[3]);
    const endDay = numeric[4] ? Number(numeric[4]) : startDay;
    const startIso = toIsoDate(year, month, startDay);
    const endIso = toIsoDate(year, month, endDay);
    if (startIso && endIso) return { startDate: startIso, endDate: endIso };
  }

  const rangeWithD = normalized.match(/(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\s*[-–]\s*(\d{1,2})\s*d\.?/i);
  if (rangeWithD) {
    const year = Number(rangeWithD[1]);
    const month = Number(rangeWithD[2]);
    const startDay = Number(rangeWithD[3]);
    const endDay = Number(rangeWithD[4]);
    const startIso = toIsoDate(year, month, startDay);
    const endIso = toIsoDate(year, month, endDay);
    if (startIso && endIso) return { startDate: startIso, endDate: endIso };
  }

  return null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    return null;
  }
  return iso;
}

export function inferLtCity(venue: string | null | undefined, fallback: string | null | undefined): string | null {
  const text = `${venue ?? ""} ${fallback ?? ""}`.toLowerCase();
  if (/vilni|gineiti|nemėž|nemez|žirg|zirg|saltoni|ginduliai arim/.test(text)) return "Vilnius";
  if (/klaip|gindul/.test(text)) return "Klaipėda";
  if (/kaun/.test(text)) return "Kaunas";
  if (/nida|nidos/.test(text)) return "Nida";
  return fallback?.trim() || null;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
