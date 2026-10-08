import type { RawObservation } from "@/lib/discovery/types";
import { mapRegistryToSourceType, type RegistrySource } from "@/lib/discovery/registry-types";

export type FacebookPostInput = {
  id: string;
  message: string;
  permalink: string;
  createdTime?: string | null;
  eventLink?: string | null;
};

const MONTHS_LT = [
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio",
];

const MONTHS_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function extractFromFacebookText(
  source: RegistrySource,
  post: FacebookPostInput,
): RawObservation | null {
  const text = post.message?.trim();
  if (!text || text.length < 12) return null;
  if (!looksLikeTournamentAnnouncement(text)) return null;

  const title = extractTitle(text);
  const startDate = extractDate(text, post.createdTime);
  if (!title || !startDate) return null;

  const city = extractCity(text) ?? source.city;
  const venue = extractVenue(text);
  const organiser = extractOrganiser(text) ?? source.sourceName;
  const gender = extractGender(text);
  const format = extractFormat(text);
  const registrationUrl = extractRegistrationUrl(text) ?? post.eventLink ?? null;
  const registrationStatus = extractRegistrationStatus(text);
  const price = extractPrice(text);
  const times = extractTimeRange(text);

  const description = text.length > 500 ? `${text.slice(0, 497)}…` : text;

  return {
    title,
    eventType: "TOURNAMENT",
    startDate,
    endDate: startDate,
    registrationDeadline: null,
    countryCode: source.countryCode ?? "lt",
    region: source.region,
    city,
    venue,
    timezone: "Europe/Vilnius",
    originalLevel: extractLevel(text),
    gender,
    ageGroup: null,
    format,
    organiser,
    organiserUrl: source.url.startsWith("http") && !source.url.includes("facebook.com") ? source.url : null,
    officialEventUrl: post.eventLink ?? null,
    registrationUrl,
    priceAmount: price?.amount ?? null,
    currency: price?.currency ?? null,
    description,
    registrationStatus,
    sourceName: source.sourceName,
    sourceUrl: post.permalink,
    sourceType: mapRegistryToSourceType(source.registrySourceType),
    sourceConfidence: "medium",
    registrySourceType: source.registrySourceType,
    startTime: times?.start ?? null,
    endTime: times?.end ?? null,
  };
}

function looksLikeTournamentAnnouncement(text: string): boolean {
  const lower = text.toLowerCase();
  const signals = [
    "turnyr",
    "tournament",
    "čempion",
    "dvejet",
    "vienet",
    "mixed",
    "registrac",
    "messenger",
    "arena",
    "kort",
    "🎾",
  ];
  return signals.some((signal) => lower.includes(signal));
}

function extractTitle(text: string): string | null {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0]?.replace(/^🎾\s*/, "") ?? "";
  if (first.length >= 6 && first.length <= 120) return first;
  const match = text.match(/(?:turnyras|turnyras!|tournament)[:\s-]*(.{5,80})/i);
  return match ? match[1].trim() : lines[0]?.slice(0, 100) ?? null;
}

function extractDate(text: string, fallbackIso?: string | null): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dotted = text.match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
  if (dotted) {
    const day = dotted[1].padStart(2, "0");
    const month = dotted[2].padStart(2, "0");
    return `${dotted[3]}-${month}-${day}`;
  }

  const monthName = extractMonthDay(text);
  if (monthName) return monthName;

  if (fallbackIso) {
    const d = new Date(fallbackIso);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function extractMonthDay(text: string): string | null {
  const lower = text.toLowerCase();
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();

  for (let i = 0; i < MONTHS_LT.length; i += 1) {
    const dayFirst = new RegExp(`\\b(\\d{1,2})\\s+${MONTHS_LT[i]}`, "i");
    const monthFirst = new RegExp(`\\b${MONTHS_LT[i]}\\s+(\\d{1,2})`, "i");
    const m = lower.match(dayFirst) ?? lower.match(monthFirst);
    if (m) {
      const day = m[1].padStart(2, "0");
      const month = String(i + 1).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  for (let i = 0; i < MONTHS_EN.length; i += 1) {
    const re = new RegExp(`\\b${MONTHS_EN[i]}\\s+(\\d{1,2})`, "i");
    const m = lower.match(re);
    if (m) {
      const day = m[1].padStart(2, "0");
      const month = String(i + 1).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const october = lower.match(/\boctober\s+(\d{1,2})\b/i);
  if (october) {
    return `${year}-10-${october[1].padStart(2, "0")}`;
  }
  return null;
}

function extractCity(text: string): string | null {
  const cities = [
    "Vilnius",
    "Kaunas",
    "Klaipėda",
    "Šiauliai",
    "Panevėžys",
    "Alytus",
    "Elektrėnai",
    "Nida",
    "Palanga",
    "Druskininkai",
    "Birštonas",
    "Dubingiai",
  ];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return null;
}

function extractVenue(text: string): string | null {
  const venues = [
    "Widen Arena",
    "SEB Arena",
    "Tennis Space",
    "Teniso Erdvė",
    "Bernardinų",
    "Nidos Setas",
    "Club Dubingiai",
  ];
  const lower = text.toLowerCase();
  for (const venue of venues) {
    if (lower.includes(venue.toLowerCase())) return venue;
  }
  const arena = text.match(/\b([A-ZĄČĘĖĮŠŲŪŽ][\w\s]{2,30}Arena)\b/);
  return arena ? arena[1].trim() : null;
}

function extractOrganiser(text: string): string | null {
  const match = text.match(/(?:organiz(?:uoja|atorius)|organizer)[:\s]+([^\n,.]{3,40})/i);
  return match ? match[1].trim() : null;
}

function extractGender(text: string): string | null {
  const lower = text.toLowerCase();
  if (/moter|women|ladies|m\.? dvejet|m\.? vienet/i.test(lower)) return "women";
  if (/vyr|men|m\.? dvejet|m\.? vienet/i.test(lower)) return "men";
  if (/mixed|mišr/i.test(lower)) return "mixed";
  if (/open|atviri/i.test(lower)) return "open";
  return null;
}

function extractFormat(text: string): string | null {
  const lower = text.toLowerCase();
  if (/mišr/i.test(lower) || /mixed doubles/i.test(lower)) return "mixed doubles";
  if (/dvejet/i.test(lower) || /doubles/i.test(lower)) return "doubles";
  if (/vienet/i.test(lower) || /singles/i.test(lower)) return "singles";
  return null;
}

function extractLevel(text: string): string | null {
  const match = text.match(/\b(NTRP\s?\d(?:\.\d)?|beginner|intermediate|advanced|mėgėj|amateur|recreational)\b/i);
  return match ? match[1] : null;
}

function extractRegistrationUrl(text: string): string | null {
  const url = text.match(/https?:\/\/[^\s)]+/i);
  return url ? url[0].replace(/[.,]+$/, "") : null;
}

function extractRegistrationStatus(text: string): string | null {
  const lower = text.toLowerCase();
  if (/messenger|registracij|registruotis|registration/i.test(lower)) return "open";
  if (/invitation|tik pakviest|closed|uždaryta/i.test(lower)) {
    return /invitation|pakviest/i.test(lower) ? "invitation_only" : "closed";
  }
  return "unknown";
}

function extractPrice(text: string): { amount: number; currency: string } | null {
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)\s?(€|eur)/i);
  if (!match) return null;
  return { amount: Number(match[1].replace(",", ".")), currency: "EUR" };
}

function extractTimeRange(text: string): { start: string; end: string } | null {
  const match = text.match(/\b(\d{1,2}[:.]\d{2})\s?[-–]\s?(\d{1,2}[:.]\d{2})\b/);
  if (!match) return null;
  return { start: match[1].replace(".", ":"), end: match[2].replace(".", ":") };
}
