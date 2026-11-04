import type { Locale } from "@/lib/i18n";
import { isPubliclyChecked } from "@/lib/discovery/review";
import { translationFor } from "@/lib/tournaments/present";
import type { TournamentRecord } from "@/lib/tournaments/types";

/** Slim, serialisable tournament shape used by the hero ball popup. */
export type HeroPick = {
  id: string;
  slug: string;
  name: string;
  city: string;
  countryCode: string;
  countryNameEn: string;
  countryNameLt: string;
  startsOn: string;
  endsOn: string;
  venueName: string | null;
  eventFormat: string;
  surface: string;
  environment: string;
  playLevel: string | null;
  ageGroup: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  priceLabel: string | null;
  registrationDeadline: string | null;
  organizerName: string | null;
  checked: boolean;
  description: string | null;
  catalogSection: TournamentRecord["catalogSection"];
};

const PER_SECTION_LIMIT = 20;

export function toHeroPick(tournament: TournamentRecord, locale: Locale): HeroPick {
  return {
    id: tournament.id,
    slug: tournament.slug,
    name: tournament.name,
    city: tournament.city,
    countryCode: tournament.countryCode,
    countryNameEn: tournament.countryNameEn,
    countryNameLt: tournament.countryNameLt,
    startsOn: tournament.startsOn,
    endsOn: tournament.endsOn,
    venueName: tournament.venueName,
    eventFormat: tournament.eventFormat,
    surface: tournament.surface,
    environment: tournament.environment,
    playLevel: tournament.playLevel,
    ageGroup: tournament.ageGroup || tournament.categories[0]?.ageLabel || null,
    priceAmount: tournament.priceAmount,
    priceCurrency: tournament.priceCurrency,
    priceLabel: tournament.priceLabel,
    registrationDeadline: tournament.registrationDeadline,
    organizerName: tournament.organizerName,
    checked: isPubliclyChecked(tournament),
    description: translationFor(tournament, locale)?.description ?? null,
    catalogSection: tournament.catalogSection,
  };
}

/** Real (non-sample), upcoming tournaments from several pools, trimmed and de-duplicated. */
export function buildHeroPool(pools: TournamentRecord[][], locale: Locale, today: string): HeroPick[] {
  const seen = new Set<string>();
  const picks: HeroPick[] = [];
  for (const pool of pools) {
    let taken = 0;
    for (const tournament of pool) {
      if (taken >= PER_SECTION_LIMIT) break;
      if (tournament.isTest || tournament.endsOn < today || seen.has(tournament.id)) continue;
      seen.add(tournament.id);
      picks.push(toHeroPick(tournament, locale));
      taken += 1;
    }
  }
  return picks;
}
