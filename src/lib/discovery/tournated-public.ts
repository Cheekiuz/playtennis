import { politeFetch, sleep } from "@/lib/discovery/http";
import type { Gender } from "@/lib/tournaments/types";
import type { IngestCategory, RawObservation } from "@/lib/discovery/types";

export const TOURNATED_GRAPHQL_URL = "https://api.tournated.com/graphql";

export type TournatedPlatformConfig = {
  id: string;
  platformId: number;
  siteOrigin: string;
  sourceName: string;
  countryCode: string;
  defaultTimezone: string;
  excludePlatformIds: number[];
};

export const TOURNATED_LT: TournatedPlatformConfig = {
  id: "lt",
  platformId: 10,
  siteOrigin: "https://play.tennis.lt",
  sourceName: "Lietuvos teniso sąjunga (play.tennis.lt)",
  countryCode: "lt",
  defaultTimezone: "Europe/Vilnius",
  excludePlatformIds: [14, 101],
};

export const TOURNATED_LV: TournatedPlatformConfig = {
  id: "lv",
  platformId: 7,
  siteOrigin: "https://play.teniss.lat",
  sourceName: "Latvijas Tenisa Savienība (play.teniss.lat)",
  countryCode: "lv",
  defaultTimezone: "Europe/Riga",
  excludePlatformIds: [14, 101],
};

export const TOURNATED_PLATFORMS = [TOURNATED_LT, TOURNATED_LV] as const;

const LIST_QUERY = `
query getPublicTournamentList($input: PublicTournamentListInput!) {
  publicTournamentList(input: $input) {
    items {
      id
      title
      startDate
      endDate
      entryDeadline
      registrationStartDate
      timeZone
      city
      country
      address
      closeRegistration
      registerLink
      status
      competitionType
      venues {
        title
        city
        country
      }
      organizer {
        organizationName
      }
      tournamentCategory {
        fee
        currency
        status
        category {
          name
          gender
          ageGroup
          type
        }
      }
    }
    total
    hasMore
  }
}
`;

export type TournatedListItem = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  entryDeadline: string | null;
  registrationStartDate: string | null;
  timeZone: string;
  city: string;
  country: string;
  address: string;
  closeRegistration: boolean;
  registerLink: string;
  status: string;
  competitionType: string;
  venues: { title: string; city: string; country: string }[];
  organizer: { organizationName: string | null } | null;
  tournamentCategory: {
    fee: number | null;
    currency: string | null;
    status: string | null;
    category: { name: string; gender: string | null; ageGroup: string | null; type: string | null } | null;
  }[];
};

export function mapTournatedItem(item: TournatedListItem, platform: TournatedPlatformConfig): RawObservation {
  const venue = item.venues[0];
  const city = venue?.city || item.city || "";
  const countryCode = (venue?.country || item.country || platform.countryCode.toUpperCase()).slice(0, 2).toLowerCase();
  const organiser = item.organizer?.organizationName?.trim() || venue?.title || null;
  const officialUrl = `${platform.siteOrigin}/tournaments/${item.id}`;
  const registrationUrl = item.registerLink?.trim() || officialUrl;
  const categories = item.tournamentCategory.filter((row) => row.category);
  const priced = categories.filter((row) => row.fee != null && row.currency);
  const minFee = priced.length > 0 ? Math.min(...priced.map((row) => row.fee ?? 0)) : null;
  const currency = priced[0]?.currency ?? null;
  const genders = new Set(categories.map((row) => row.category?.gender).filter(Boolean));
  const ageGroups = [...new Set(categories.map((row) => row.category?.ageGroup).filter(Boolean))];

  return {
    title: item.title.trim(),
    eventType: item.competitionType === "TOURNAMENT" ? "TOURNAMENT" : "OTHER",
    startDate: isoDate(item.startDate),
    endDate: isoDate(item.endDate),
    registrationDeadline: item.entryDeadline ? isoDate(item.entryDeadline) : null,
    countryCode,
    city,
    venue: venue?.title ?? null,
    address: item.address?.trim() || null,
    timezone: item.timeZone || platform.defaultTimezone,
    originalLevel: categories[0]?.category?.name ?? null,
    gender: mapGender(genders),
    ageGroup: ageGroups[0] ?? null,
    organiser,
    officialEventUrl: officialUrl,
    registrationUrl,
    priceAmount: minFee,
    currency,
    registrationStatus: mapRegistration(item),
    sourceName: platform.sourceName,
    sourceUrl: officialUrl,
    sourceType: "federation",
    sourceConfidence: "high",
    ingestCategories: mapCategories(categories),
  };
}

export async function fetchTournatedUpcoming(
  platform: TournatedPlatformConfig,
  options?: { pageSize?: number; maxPages?: number },
): Promise<TournatedListItem[]> {
  const pageSize = options?.pageSize ?? 30;
  const maxPages = options?.maxPages ?? 20;
  const startDateFrom = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const items: TournatedListItem[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const response = await politeFetch(TOURNATED_GRAPHQL_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: LIST_QUERY,
        variables: {
          input: {
            page,
            limit: pageSize,
            filter: {
              platformIds: [platform.platformId],
              sportIds: [],
              competitionType: "TOURNAMENT",
              startDateFrom,
              exclude: { platformIds: platform.excludePlatformIds },
            },
            orderBy: "START_DATE_ASC",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`${platform.id} list failed (${response.status}).`);
    }

    const payload = (await response.json()) as {
      data?: { publicTournamentList?: { items: TournatedListItem[]; hasMore: boolean } };
      errors?: { message: string }[];
    };
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    const batch = payload.data?.publicTournamentList;
    if (!batch) break;
    items.push(...batch.items);
    if (!batch.hasMore) break;
    await sleep(350);
  }

  return items;
}

/** @deprecated Use fetchTournatedUpcoming(TOURNATED_LT). */
export async function fetchLtsUpcomingTournaments(options?: { pageSize?: number; maxPages?: number }) {
  return fetchTournatedUpcoming(TOURNATED_LT, options);
}

function mapCategories(
  rows: TournatedListItem["tournamentCategory"],
): IngestCategory[] {
  return rows.flatMap((row) => {
    if (!row.category) return [];
    return [
      {
        discipline: mapDiscipline(row.category.type),
        gender: mapCategoryGender(row.category.gender),
        ageLabel: row.category.ageGroup ?? row.category.name,
        entryFeeAmount: row.fee,
        currency: row.currency,
        registrationStatus: mapCategoryRegistration(row.status),
      },
    ];
  });
}

function mapDiscipline(value: string | null): IngestCategory["discipline"] {
  if (value === "double" || value === "doubles") return "doubles";
  if (value === "mixed_doubles") return "mixed_doubles";
  return "singles";
}

function mapCategoryGender(value: string | null): IngestCategory["gender"] {
  if (value === "male") return "men";
  if (value === "female") return "women";
  if (value === "mixed") return "mixed";
  return "open";
}

function mapCategoryRegistration(value: string | null): IngestCategory["registrationStatus"] {
  const text = value?.toLowerCase() ?? "";
  if (text === "open") return "open";
  if (text === "closed") return "closed";
  return "unknown";
}

function mapRegistration(item: TournatedListItem): string | null {
  if (item.closeRegistration || item.status !== "active") return "closed";
  const now = Date.now();
  if (item.registrationStartDate && Date.parse(item.registrationStartDate) > now) return "coming soon";
  const deadline = item.entryDeadline ? Date.parse(item.entryDeadline) : null;
  if (deadline != null && deadline < now) return "closed";
  const open = item.tournamentCategory.some((row) => row.status?.toLowerCase() === "open");
  if (open) return "open";
  return null;
}

function mapGender(genders: Set<string | null | undefined>): Gender | null {
  const hasMale = genders.has("male");
  const hasFemale = genders.has("female");
  if (hasMale && hasFemale) return "mixed";
  if (hasMale) return "men";
  if (hasFemale) return "women";
  return "open";
}

function isoDate(value: string): string {
  return value.slice(0, 10);
}
