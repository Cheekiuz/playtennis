import { readFile } from "node:fs/promises";
import path from "node:path";
import { politeFetch, sleep } from "@/lib/discovery/http";
import type { RawObservation } from "@/lib/discovery/types";
import { countryCodeFromName } from "@/lib/tournaments/countries";

const ITF_CALENDAR_URL = "https://www.itftennis.com/tennis/api/TournamentApi/GetCalendar";
const ITF_SITE = "https://www.itftennis.com";
/** World Tennis Masters Tour (not Men's World Tennis Tour MT). */
export const ITF_MASTERS_CIRCUIT = "VT";
export const ITF_SOURCE_ID = "00000000-0000-4000-8000-000000000050";
export const ITF_SOURCE_KEY = "itf_masters_calendar";
const SEED_PATH = path.join(process.cwd(), "data", "itf-masters-calendar.json");

export type ItfCalendarItem = {
  tournamentName?: string;
  name?: string;
  category?: string;
  hostNation?: string;
  hostNationCode?: string;
  venue?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  surfaceDesc?: string;
  surfaceCode?: string;
  indoorOrOutDoor?: string;
  tourStatusCode?: string | null;
  tourStatusDesc?: string | null;
  tournamentKey?: string;
  tournamentLink?: string;
  promotionalName?: string;
};

type CalendarResponse = {
  items?: ItfCalendarItem[];
  totalItems?: number;
};

export type ItfFetchResult = {
  observations: RawObservation[];
  fetched: number;
  skipped: number;
  errors: string[];
};

export async function fetchItfMastersCalendar(options?: {
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  maxPages?: number;
  allowSeedFallback?: boolean;
}): Promise<ItfFetchResult> {
  const live = await fetchItfMastersCalendarLive(options);
  if (live.fetched > 0 || live.observations.length > 0) return live;

  const allowSeed = options?.allowSeedFallback !== false;
  if (!allowSeed) return live;

  const seed = await loadItfMastersSeed();
  if (!seed) {
    return {
      ...live,
      errors: [...live.errors, "ITF live calendar blocked or empty, and no local seed file was found."],
    };
  }

  return {
    observations: seed.observations,
    fetched: seed.fetched,
    skipped: seed.skipped,
    errors: [
      ...live.errors,
      "ITF live calendar blocked (Incapsula/HTML). Used bundled seed data/itf-masters-calendar.json.",
    ],
  };
}

async function fetchItfMastersCalendarLive(options?: {
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  maxPages?: number;
}): Promise<ItfFetchResult> {
  const pageSize = options?.pageSize ?? 100;
  const maxPages = options?.maxPages ?? 30;
  const year = new Date().getUTCFullYear();
  const dateFrom = options?.dateFrom ?? `${year - 1}-01-01`;
  const dateTo = options?.dateTo ?? `${year + 1}-12-31`;

  const observations: RawObservation[] = [];
  const errors: string[] = [];
  let fetched = 0;
  let skipped = 0;
  let skip = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(ITF_CALENDAR_URL);
    url.searchParams.set("circuitCode", ITF_MASTERS_CIRCUIT);
    url.searchParams.set("searchString", "");
    url.searchParams.set("skip", String(skip));
    url.searchParams.set("take", String(pageSize));
    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    url.searchParams.set("orderField", "startDate");
    url.searchParams.set("isOrderAscending", "true");

    let json: CalendarResponse;
    try {
      const response = await politeFetch(url.toString(), {
        headers: {
          Accept: "application/json, text/plain, */*",
          Referer: `${ITF_SITE}/en/tournament-calendar/world-tennis-masters-tour-calendar/`,
          Origin: ITF_SITE,
          "user-agent":
            "Mozilla/5.0 (compatible; PlayTennisBot/1.0; +https://www.playtennis.lt; amateur tournament aggregator)",
        },
      });
      if (!response.ok) {
        errors.push(`ITF calendar HTTP ${response.status} at skip=${skip}`);
        break;
      }
      const text = await response.text();
      if (looksLikeIncapsulaHtml(text)) {
        errors.push("ITF calendar returned Incapsula/HTML instead of JSON (bot protection).");
        break;
      }
      json = JSON.parse(text) as CalendarResponse;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "ITF calendar fetch failed");
      break;
    }

    const items = json.items ?? [];
    fetched += items.length;
    for (const item of items) {
      const mapped = mapItfItem(item);
      if (!mapped) {
        skipped += 1;
        continue;
      }
      observations.push(mapped);
    }

    const total = typeof json.totalItems === "number" ? json.totalItems : skip + items.length;
    skip += pageSize;
    if (items.length === 0 || skip >= total) break;
    await sleep(750);
  }

  return { observations, fetched, skipped, errors };
}

async function loadItfMastersSeed(): Promise<{ observations: RawObservation[]; fetched: number; skipped: number } | null> {
  try {
    const raw = await readFile(SEED_PATH, "utf8");
    const json = JSON.parse(raw) as { items?: ItfCalendarItem[] };
    const items = json.items ?? [];
    const observations: RawObservation[] = [];
    let skipped = 0;
    for (const item of items) {
      const mapped = mapItfItem(item);
      if (!mapped) {
        skipped += 1;
        continue;
      }
      observations.push(mapped);
    }
    return { observations, fetched: items.length, skipped };
  } catch {
    return null;
  }
}

function looksLikeIncapsulaHtml(text: string): boolean {
  const head = text.slice(0, 200).toLowerCase();
  return head.includes("<html") || head.includes("incapsula") || head.includes("<!doctype");
}

export function mapItfItem(item: ItfCalendarItem): RawObservation | null {
  const name = (item.tournamentName ?? item.name ?? "").trim();
  const startDate = toDateOnly(item.startDate);
  if (!name || !startDate) return null;

  if (isCancelled(item) || isClosedName(name)) return null;

  const endDate = toDateOnly(item.endDate) ?? startDate;
  const countryCode =
    iocToIso(item.hostNationCode) ?? countryCodeFromName(item.hostNation ?? "") ?? "xx";
  const city = (item.venue || item.location || item.hostNation || "Unknown").trim();
  const key = (item.tournamentKey ?? "").trim() || null;
  const path = item.tournamentLink?.startsWith("/") ? item.tournamentLink : null;
  const officialUrl = path ? `${ITF_SITE}${path}` : `${ITF_SITE}/en/tournament-calendar/world-tennis-masters-tour-calendar/`;

  return {
    title: name,
    eventType: "TOURNAMENT",
    startDate,
    endDate,
    countryCode,
    city,
    venue: item.venue?.trim() || null,
    surface: mapSurface(item.surfaceCode, item.surfaceDesc),
    indoorOutdoor: mapEnvironment(item.indoorOrOutDoor),
    originalLevel: item.category?.trim() || null,
    ageGroup: "30+",
    organiser: "ITF World Tennis Masters Tour",
    organiserUrl: `${ITF_SITE}/en/tours/world-tennis-masters-tour/`,
    officialEventUrl: officialUrl,
    registrationUrl: officialUrl,
    registrationStatus: "UNKNOWN",
    sourceName: "ITF World Tennis Masters Tour calendar",
    sourceUrl: officialUrl,
    sourceType: "public_calendar",
    sourceConfidence: "high",
    sourceExternalId: key,
    catalogSection: "itf",
    itfCategory: item.category?.trim() || null,
    isClosed: false,
    visibility: "public",
  };
}

function isCancelled(item: ItfCalendarItem): boolean {
  const code = (item.tourStatusCode ?? "").toUpperCase();
  const desc = (item.tourStatusDesc ?? "").toLowerCase();
  const name = (item.tournamentName ?? item.name ?? "").toLowerCase();
  return code === "CN" || desc.includes("cancel") || name.includes("cancelled") || name.includes("canceled");
}

function isClosedName(name: string): boolean {
  return /\bclosed\b/i.test(name) || /-\s*closed\b/i.test(name);
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

function mapSurface(code?: string | null, desc?: string | null): string {
  const c = (code ?? "").toUpperCase();
  if (c === "C") return "clay";
  if (c === "H") return "hard";
  if (c === "G") return "grass";
  if (c === "A") return "carpet";
  const d = (desc ?? "").toLowerCase();
  if (d.includes("clay")) return "clay";
  if (d.includes("grass")) return "grass";
  if (d.includes("carpet")) return "carpet";
  if (d.includes("hard")) return "hard";
  return "unknown";
}

function mapEnvironment(value?: string | null): "indoor" | "outdoor" | "mixed" | null {
  const text = (value ?? "").toLowerCase();
  if (text.includes("indoor")) return "indoor";
  if (text.includes("outdoor")) return "outdoor";
  return null;
}

/** Common ITF host nation codes (IOC-style) → ISO 3166-1 alpha-2. */
function iocToIso(code?: string | null): string | null {
  if (!code) return null;
  const key = code.trim().toUpperCase();
  return IOC_TO_ISO[key] ?? null;
}

const IOC_TO_ISO: Record<string, string> = {
  ALB: "al",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BRA: "br",
  BUL: "bg",
  CAN: "ca",
  CHI: "cl",
  CHN: "cn",
  COL: "co",
  CRO: "hr",
  CYP: "cy",
  CZE: "cz",
  DEN: "dk",
  ECU: "ec",
  EGY: "eg",
  ESP: "es",
  EST: "ee",
  FIN: "fi",
  FRA: "fr",
  GBR: "gb",
  GEO: "ge",
  GER: "de",
  GRE: "gr",
  HKG: "hk",
  HUN: "hu",
  IND: "in",
  IRI: "ir",
  IRL: "ie",
  ISR: "il",
  ITA: "it",
  JPN: "jp",
  KAZ: "kz",
  KOR: "kr",
  LAT: "lv",
  LTU: "lt",
  LUX: "lu",
  MAR: "ma",
  MDA: "md",
  MEX: "mx",
  MKD: "mk",
  MNE: "me",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAR: "py",
  PER: "pe",
  PHI: "ph",
  POL: "pl",
  POR: "pt",
  ROU: "ro",
  RSA: "za",
  RUS: "ru",
  SLO: "si",
  SRB: "rs",
  SUI: "ch",
  SVK: "sk",
  SWE: "se",
  THA: "th",
  TPE: "tw",
  TUN: "tn",
  TUR: "tr",
  UAE: "ae",
  UKR: "ua",
  URU: "uy",
  USA: "us",
  UZB: "uz",
  VEN: "ve",
};
