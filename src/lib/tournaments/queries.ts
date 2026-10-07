import { createServerSupabaseClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/tournaments/countries";
import { rangeForPreset, todayIso } from "@/lib/tournaments/dates";
import type {
  Audience,
  Discipline,
  Environment,
  Gender,
  Level,
  LifecycleStatus,
  RegistrationStatus,
  Surface,
  TournamentCategory,
  TournamentFilters,
  TournamentRecord,
} from "@/lib/tournaments/types";

const SELECT = `
  id, slug, name, series_name, tournament_type, audience, country_code, city,
  starts_on, ends_on, timezone, registration_deadline, registration_status,
  registration_url, official_url, source_url, surface, environment,
  contact_name, contact_email, contact_phone, image_url, prize_summary,
  lifecycle_status, verification_status, last_verified_at, published, updated_at,
  countries (name_en, name_lt),
  venues (name, address, latitude, longitude),
  organizers (name, website),
  sources (name),
  tournament_categories (
    id, discipline, gender, age_min, age_max, age_label, level,
    ranking_requirement, entry_fee_amount, currency, registration_deadline,
    registration_status, sort_order
  ),
  tournament_translations (locale, description, seo_title, seo_description)
`;

export type TournamentQueryResult = {
  items: TournamentRecord[];
  total: number;
  ready: boolean;
};

const EMPTY: TournamentQueryResult = { items: [], total: 0, ready: false };

export function parseFilters(raw: Record<string, string | string[] | undefined>): TournamentFilters {
  const one = (key: string) => {
    const value = raw[key];
    const text = Array.isArray(value) ? value[0] : value;
    return text?.trim() || undefined;
  };
  const page = Number(one("page") ?? "1");

  return {
    q: one("q"),
    country: one("country")?.toLowerCase(),
    when: one("when"),
    from: one("from"),
    to: one("to"),
    audience: one("audience"),
    surface: one("surface"),
    environment: one("environment"),
    city: one("city"),
    age: one("age"),
    gender: one("gender"),
    discipline: one("discipline"),
    level: one("level"),
    registration: one("registration"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function filtersAreIndexable(filters: TournamentFilters): boolean {
  return !Object.entries(filters).some(([key, value]) => key !== "page" && value && value !== 1);
}

export async function listTournaments(filters: TournamentFilters, pageSize = 24): Promise<TournamentQueryResult> {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("tournaments")
      .select(SELECT)
      .eq("published", true)
      .is("archived_at", null)
      .order("starts_on", { ascending: true })
      .limit(400);

    if (filters.audience && isAudience(filters.audience)) {
      query = query.eq("audience", filters.audience);
    } else {
      query = query.neq("audience", "professional");
    }

    if (!filters.when && !filters.from) {
      query = query.gte("ends_on", todayIso());
    }

    const range = rangeForPreset(filters.when, filters.from, filters.to);
    if (range) {
      query = query.lte("starts_on", range.to).gte("ends_on", range.from);
    }

    if (filters.country && /^[a-z]{2}$/.test(filters.country)) {
      query = query.eq("country_code", filters.country);
    }
    if (filters.surface) query = query.eq("surface", filters.surface);
    if (filters.environment) query = query.eq("environment", filters.environment);
    if (filters.registration) query = query.eq("registration_status", filters.registration);
    if (filters.city) query = query.ilike("city", `%${sanitizeLike(filters.city)}%`);

    if (filters.q) {
      const safe = sanitizeLike(filters.q);
      const country = COUNTRIES.find((item) => {
        const needle = filters.q!.toLowerCase();
        return item.nameEn.toLowerCase().includes(needle) || item.nameLt.toLowerCase().includes(needle);
      });
      const clauses = [`name.ilike.%${safe}%`, `city.ilike.%${safe}%`];
      if (country) clauses.push(`country_code.eq.${country.code}`);
      query = query.or(clauses.join(","));
    }

    const { data, error } = await query;
    if (error) {
      console.error("listTournaments", error.message);
      return { items: [], total: 0, ready: true };
    }

    const mapped = (data ?? [])
      .map((row) => mapTournament(row as Record<string, unknown>))
      .filter((tournament) => matchesCategories(tournament, filters));

    const page = filters.page ?? 1;
    const start = (page - 1) * pageSize;
    return {
      items: mapped.slice(start, start + pageSize),
      total: mapped.length,
      ready: true,
    };
  } catch (error) {
    console.error("listTournaments", error);
    return EMPTY;
  }
}

export async function getTournament(slug: string): Promise<TournamentRecord | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select(SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      console.error("getTournament", error.message);
      return null;
    }
    return data ? mapTournament(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error("getTournament", error);
    return null;
  }
}

export async function getTournamentsByIds(ids: string[]): Promise<TournamentRecord[]> {
  const unique = [...new Set(ids)].slice(0, 50);
  if (unique.length === 0) return [];

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select(SELECT)
      .in("id", unique)
      .eq("published", true)
      .is("archived_at", null);

    if (error || !data) return [];
    const byId = new Map(data.map((row) => {
      const tournament = mapTournament(row as Record<string, unknown>);
      return [tournament.id, tournament] as const;
    }));
    return unique.flatMap((id) => {
      const tournament = byId.get(id);
      return tournament ? [tournament] : [];
    });
  } catch (error) {
    console.error("getTournamentsByIds", error);
    return [];
  }
}

export async function listAdminTournaments(): Promise<TournamentRecord[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select(SELECT)
      .is("archived_at", null)
      .order("starts_on", { ascending: true })
      .limit(200);
    if (error || !data) return [];
    return data.map((row) => mapTournament(row as Record<string, unknown>));
  } catch (error) {
    console.error("listAdminTournaments", error);
    return [];
  }
}

export async function getAdminTournament(id: string): Promise<TournamentRecord | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("tournaments").select(SELECT).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return mapTournament(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listSitemapTournaments(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("slug, updated_at")
      .eq("published", true)
      .is("archived_at", null)
      .gte("ends_on", todayIso())
      .neq("lifecycle_status", "cancelled")
      .neq("audience", "professional")
      .limit(5000);

    if (error || !data) return [];
    return data.map((row) => ({ slug: String(row.slug), updatedAt: String(row.updated_at) }));
  } catch {
    return [];
  }
}

function matchesCategories(tournament: TournamentRecord, filters: TournamentFilters): boolean {
  const needsCategory = Boolean(filters.age || filters.gender || filters.discipline || filters.level);
  if (!needsCategory) return true;

  return tournament.categories.some((category) => {
    if (filters.gender && category.gender !== filters.gender) return false;
    if (filters.discipline && category.discipline !== filters.discipline) return false;
    if (filters.level && category.level !== filters.level) return false;
    if (filters.age && !matchesAge(category, filters.age)) return false;
    return true;
  });
}

function matchesAge(category: TournamentCategory, age: string): boolean {
  if (age === "open") return category.ageMin == null && category.ageMax == null;
  if (age === "u18") return category.ageMax != null && category.ageMax <= 18;
  const years = Number(age);
  if (!Number.isFinite(years)) return true;
  const minOk = category.ageMin == null || category.ageMin <= years;
  const maxOk = category.ageMax == null || category.ageMax >= years;
  return minOk && maxOk;
}

function mapTournament(row: Record<string, unknown>): TournamentRecord {
  const country = one(row.countries) as { name_en?: string; name_lt?: string } | null;
  const venue = one(row.venues) as { name?: string; address?: string; latitude?: number; longitude?: number } | null;
  const organizer = one(row.organizers) as { name?: string; website?: string } | null;
  const source = one(row.sources) as { name?: string } | null;
  const translations = asArray(row.tournament_translations) as {
    locale?: string;
    description?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
  }[];
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    seriesName: text(row.series_name),
    organizerName: organizer?.name ?? null,
    organizerWebsite: organizer?.website ?? null,
    tournamentType: String(row.tournament_type ?? "other"),
    audience: (row.audience as Audience) ?? "recreational",
    countryCode: String(row.country_code),
    countryNameEn: country?.name_en ?? "",
    countryNameLt: country?.name_lt ?? "",
    city: String(row.city),
    venueName: venue?.name ?? null,
    venueAddress: venue?.address ?? null,
    latitude: numberOrNull(venue?.latitude),
    longitude: numberOrNull(venue?.longitude),
    startsOn: String(row.starts_on),
    endsOn: String(row.ends_on),
    timezone: String(row.timezone ?? "Europe/Vilnius"),
    registrationDeadline: text(row.registration_deadline),
    registrationStatus: (row.registration_status as RegistrationStatus) ?? "unknown",
    registrationUrl: text(row.registration_url),
    officialUrl: text(row.official_url),
    sourceName: source?.name ?? null,
    sourceUrl: String(row.source_url ?? ""),
    surface: (row.surface as Surface) ?? "other",
    environment: (row.environment as Environment) ?? "outdoor",
    contactName: text(row.contact_name),
    contactEmail: text(row.contact_email),
    contactPhone: text(row.contact_phone),
    imageUrl: text(row.image_url),
    prizeSummary: text(row.prize_summary),
    lifecycleStatus: (row.lifecycle_status as LifecycleStatus) ?? "upcoming",
    verificationStatus: row.verification_status === "verified" ? "verified" : "needs_verification",
    lastVerifiedAt: text(row.last_verified_at),
    published: Boolean(row.published),
    updatedAt: String(row.updated_at ?? ""),
    translations: translations.map((item) => ({
      locale: item.locale ?? "en",
      description: item.description ?? null,
      seoTitle: item.seo_title ?? null,
      seoDescription: item.seo_description ?? null,
    })),
    categories: asArray(row.tournament_categories)
      .map(mapCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function mapCategory(row: Record<string, unknown>): TournamentCategory {
  return {
    id: String(row.id),
    discipline: (row.discipline as Discipline) ?? "singles",
    gender: (row.gender as Gender) ?? "open",
    ageMin: numberOrNull(row.age_min),
    ageMax: numberOrNull(row.age_max),
    ageLabel: text(row.age_label),
    level: (row.level as Level) ?? "recreational",
    rankingRequirement: text(row.ranking_requirement),
    entryFeeAmount: numberOrNull(row.entry_fee_amount),
    currency: text(row.currency),
    registrationDeadline: text(row.registration_deadline),
    registrationStatus: (text(row.registration_status) as RegistrationStatus | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function one(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
}

function text(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function sanitizeLike(value: string): string {
  return value.replace(/[%_,]/g, "").slice(0, 80);
}

function isAudience(value: string): value is Audience {
  return value === "recreational" || value === "masters" || value === "junior" || value === "professional";
}
