import { isJuniorCategoryLabel, isJuniorOnlyTournament } from "@/lib/discovery/adult-filter";
import type { RawObservation } from "@/lib/discovery/types";
import type { TournamentCategory, TournamentRecord } from "@/lib/tournaments/types";

/** Public site and feeds: hide youth-only tournaments (including rows ingested before filters existed). */
export function isJuniorPublicTournament(
  tournament: Pick<
    TournamentRecord,
    | "name"
    | "startsOn"
    | "audience"
    | "playAudience"
    | "ageGroup"
    | "originalLevel"
    | "eventGender"
    | "categories"
  >,
): boolean {
  if (tournament.audience === "junior" || tournament.playAudience === "JUNIORS") return true;

  return isJuniorOnlyTournament(toObservation(tournament));
}

function toObservation(
  tournament: Pick<
    TournamentRecord,
    "name" | "startsOn" | "ageGroup" | "originalLevel" | "eventGender" | "categories"
  >,
): RawObservation {
  return {
    title: tournament.name,
    startDate: tournament.startsOn,
    ageGroup: tournament.ageGroup,
    originalLevel: tournament.originalLevel,
    gender: tournament.eventGender,
    ingestCategories: tournament.categories.map(categoryToIngest),
    sourceName: "public-record",
    sourceUrl: "https://www.playtennis.lt",
    sourceType: "other",
  };
}

function categoryToIngest(category: TournamentCategory) {
  const ageLabel =
    category.ageLabel ??
    (category.ageMax != null && category.ageMax <= 18 ? `U${category.ageMax}` : category.ageMax != null ? `${category.ageMax}+` : null);

  return {
    discipline: category.discipline,
    gender: category.gender,
    ageLabel,
    entryFeeAmount: category.entryFeeAmount,
    currency: category.currency,
    registrationStatus:
      category.registrationStatus === "open"
        ? ("open" as const)
        : category.registrationStatus === "closed"
          ? ("closed" as const)
          : ("unknown" as const),
  };
}

/** Strip youth divisions when a mixed event stays published. */
export function adultPublicCategories(categories: TournamentCategory[]): TournamentCategory[] {
  return categories.filter((category) => {
    if (category.ageMax != null && category.ageMax <= 18) return false;
    if (category.gender === "boys" || category.gender === "girls") return false;
    return !isJuniorCategoryLabel(category.ageLabel);
  });
}
