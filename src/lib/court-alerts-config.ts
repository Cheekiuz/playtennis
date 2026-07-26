export const CITIES = [{ value: "vilnius", label: "Vilnius" }] as const;

export const CLUBS: Record<string, { value: string; label: string }[]> = {
  vilnius: [{ value: "seb-arena", label: "SEB Arena" }],
};

export interface CourtOption {
  id: string;
  label: string;
}

/** SEB Arena indoor tennis courts (28). IDs match booking system court numbers. */
export const SEB_ARENA_INDOOR_COURTS: CourtOption[] = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1;
  return { id: String(n), label: `Kortas ${n}` };
});

export const COURT_ANY = "any" as const;

export type CourtValue = typeof COURT_ANY | string;

export type CityValue = (typeof CITIES)[number]["value"];

export function getCourtsForClub(club: string): CourtOption[] {
  if (club === "seb-arena") {
    return SEB_ARENA_INDOOR_COURTS;
  }
  return [];
}

export function getCourtOptionsForClub(
  club: string,
  anyLabel: string,
): { value: string; label: string }[] {
  return [
    { value: COURT_ANY, label: anyLabel },
    ...getCourtsForClub(club).map((c) => ({ value: c.id, label: c.label })),
  ];
}

export function getClubLabel(city: string, club: string): string {
  return CLUBS[city]?.find((c) => c.value === club)?.label ?? club;
}

export function getCityLabel(city: string): string {
  return CITIES.find((c) => c.value === city)?.label ?? city;
}

export function getCourtLabel(
  court: string,
  club: string,
  anyLabel: string,
  courtLabelFn: (n: string) => string,
): string {
  if (court === COURT_ANY) return anyLabel;
  const match = getCourtsForClub(club).find((c) => c.id === court);
  if (match) return match.label;
  return courtLabelFn(court);
}

/** @deprecated Use getCourtOptionsForClub */
export const COURTS = [COURT_ANY, ...SEB_ARENA_INDOOR_COURTS.map((c) => c.id)] as const;
