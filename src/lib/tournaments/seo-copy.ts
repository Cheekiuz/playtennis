import type { Locale, Messages } from "@/lib/i18n";
import { clampDescription } from "@/lib/seo";
import {
  countryLabel,
  formatDateRange,
  formatLabel,
  formatMoney,
  playLevelLabel,
  surfaceLine,
} from "@/lib/tournaments/present";
import type { TournamentRecord } from "@/lib/tournaments/types";

/** Short factual fragments (format, surface, level, fee) shared by meta, JSON-LD and on-page summaries. */
export function tournamentFacts(tournament: TournamentRecord, locale: Locale, messages: Messages): string[] {
  const facts: string[] = [];
  if (tournament.eventFormat && tournament.eventFormat !== "MULTIPLE") facts.push(formatLabel(tournament.eventFormat, messages));
  if (tournament.surface && tournament.surface !== "unknown") facts.push(surfaceLine(tournament, messages));
  if (tournament.playLevel) facts.push(playLevelLabel(tournament.playLevel, messages));
  if (tournament.ageGroup) facts.push(tournament.ageGroup);
  if (tournament.priceAmount != null && tournament.priceCurrency) {
    facts.push(
      messages.seo.feeFrom.replace("{amount}", formatMoney(tournament.priceAmount, tournament.priceCurrency, locale)),
    );
  }
  return facts;
}

export function tournamentPlace(tournament: TournamentRecord, locale: Locale): string {
  return [tournament.city, countryLabel(tournament, locale)].filter(Boolean).join(", ");
}

/** Answer-first description written from real fields (ingested template copy is not reused). */
export function tournamentDescription(tournament: TournamentRecord, locale: Locale, messages: Messages, max = 160): string {
  const facts = tournamentFacts(tournament, locale, messages);
  return clampDescription(
    messages.seo.tournamentDescription
      .replace("{name}", tournament.name)
      .replace("{place}", tournamentPlace(tournament, locale))
      .replace("{dates}", formatDateRange(tournament.startsOn, tournament.endsOn, locale))
      .replace("{facts}", facts.length > 0 ? `${facts.join(", ")}. ` : ""),
    max,
  );
}

/** Page title: tournament name plus city when the name does not already mention it. */
export function tournamentTitle(tournament: TournamentRecord): string {
  const name = tournament.name.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, "").trim();
  return name.toLowerCase().includes(tournament.city.toLowerCase()) ? name : `${name}, ${tournament.city}`;
}
