import type { Locale, Messages } from "@/lib/i18n";
import { countryName, flagEmoji } from "@/lib/tournaments/countries";
import type { TournamentCategory, TournamentRecord } from "@/lib/tournaments/types";

export function translationFor(tournament: TournamentRecord, locale: Locale) {
  return (
    tournament.translations.find((item) => item.locale === locale) ??
    tournament.translations.find((item) => item.description || item.seoDescription) ??
    null
  );
}

export function formatDateRange(start: string, end: string, locale: Locale): string {
  const tag = locale === "lt" ? "lt-LT" : "en-GB";
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const full = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" });
  if (start === end) return full.format(startDate);

  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  if (sameMonth) {
    return `${startDate.getDate()}-${full.format(endDate)}`;
  }
  return `${full.format(startDate)} - ${full.format(endDate)}`;
}

export function formatDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "lt" ? "lt-LT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDate(iso));
}

export function formatMoney(amount: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "lt" ? "lt-LT" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function countryLabel(tournament: Pick<TournamentRecord, "countryCode" | "countryNameEn" | "countryNameLt">, locale: Locale): string {
  if (locale === "lt" && tournament.countryNameLt) return tournament.countryNameLt;
  if (tournament.countryNameEn) return tournament.countryNameEn;
  return countryName(tournament.countryCode, locale);
}

export function placeLine(tournament: Pick<TournamentRecord, "city" | "countryCode" | "countryNameEn" | "countryNameLt">, locale: Locale): string {
  const flag = flagEmoji(tournament.countryCode);
  const place = `${tournament.city}, ${countryLabel(tournament, locale)}`;
  return flag ? `${flag} ${place}` : place;
}

export function surfaceLine(tournament: Pick<TournamentRecord, "surface" | "environment">, messages: Messages): string {
  return `${surfaceLabel(tournament.surface, messages)} · ${environmentLabel(tournament.environment, messages)}`;
}

export function surfaceLabel(surface: string, messages: Messages): string {
  const labels = messages.discover.surfaces as Record<string, string>;
  return labels[surface] ?? surface;
}

export function environmentLabel(environment: string, messages: Messages): string {
  const labels = messages.discover.environments as Record<string, string>;
  return labels[environment] ?? environment;
}

export function lifecycleLabel(status: string, messages: Messages): string {
  const labels = messages.discover.lifecycle as Record<string, string>;
  return labels[status] ?? status;
}

export function registrationLabel(status: string, messages: Messages): string {
  const labels = messages.discover.registration as Record<string, string>;
  return labels[status] ?? status;
}

export function eventTypeLabel(type: string, messages: Messages): string {
  const labels = messages.discover.eventTypes as Record<string, string>;
  return labels[type] ?? type;
}

export function formatLabel(format: string, messages: Messages): string {
  const labels = messages.discover.formats as Record<string, string>;
  return labels[format] ?? format;
}

export function playLevelLabel(level: string, messages: Messages): string {
  const labels = messages.discover.playLevels as Record<string, string>;
  return labels[level] ?? level;
}

export function publicRegistrationLabel(status: string, messages: Messages): string {
  const labels = messages.discover.publicRegistration as Record<string, string>;
  return labels[status] ?? status;
}

export function formatClock(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${start}-${end}` : start;
}

export function categorySummary(categories: TournamentCategory[], messages: Messages): string {
  if (categories.length === 0) return "";
  const groups = new Map<string, Set<string>>();

  for (const category of categories) {
    const who = [genderLabel(category.gender, messages), category.ageLabel].filter(Boolean).join(" ");
    const key = who || messages.discover.anyCategory;
    const set = groups.get(key) ?? new Set<string>();
    set.add(disciplineLabel(category.discipline, messages));
    groups.set(key, set);
  }

  return [...groups.entries()]
    .slice(0, 2)
    .map(([who, disciplines]) => `${who} · ${[...disciplines].join(" & ")}`)
    .join(". ");
}

export function lowestFee(categories: TournamentCategory[], locale: Locale, fromLabel: string): string | null {
  const priced = categories.filter((category) => category.entryFeeAmount != null && category.currency);
  if (priced.length === 0) return null;
  const currency = priced[0].currency;
  if (!currency || priced.some((category) => category.currency !== currency)) return null;
  const amount = Math.min(...priced.map((category) => category.entryFeeAmount ?? 0));
  return `${fromLabel} ${formatMoney(amount, currency, locale)}`;
}

export function genderLabel(gender: string, messages: Messages): string {
  const labels = messages.discover.genders as Record<string, string>;
  return labels[gender] ?? gender;
}

export function disciplineLabel(discipline: string, messages: Messages): string {
  const labels = messages.discover.disciplines as Record<string, string>;
  return labels[discipline] ?? discipline;
}

export function levelLabel(level: string, messages: Messages): string {
  const labels = messages.discover.levels as Record<string, string>;
  return labels[level] ?? level;
}

function parseDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}
