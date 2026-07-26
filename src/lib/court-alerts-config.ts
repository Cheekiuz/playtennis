export const CITIES = [{ value: "vilnius", label: "Vilnius" }] as const;

export const CLUBS: Record<string, { value: string }[]> = {
  vilnius: [{ value: "seb-arena" }, { value: "seb-bernardinai" }],
};

export type CourtSurface = "hard" | "carpet" | "clay" | "grass";

export interface CourtOption {
  id: string;
  name: string;
  surface: CourtSurface;
}

export interface CourtLabelMessages {
  courtAny: string;
  surfaces: Record<CourtSurface, string>;
  surfaceGroups: Record<CourtSurface, string>;
  courtWithSurface: string;
}

function court(id: string, surface: CourtSurface): CourtOption {
  return { id, name: id, surface };
}

/** SEB Arena indoor (Ąžuolyno g. 7): 22 hard + 6 carpet — IDs match sebarena.lt court map. */
export const SEB_ARENA_COURTS: CourtOption[] = [
  ...Array.from({ length: 15 }, (_, i) => court(String(i + 1), "hard")),
  court("C", "hard"),
  ...Array.from({ length: 6 }, (_, i) => court(String(i + 16), "hard")),
  ...Array.from({ length: 6 }, (_, i) => court(`K${i + 1}`, "carpet")),
];

/** Bernardinų sodo kortai (seasonal outdoor): 10 clay + 2 artificial grass. */
export const BERNARDAINAI_COURTS: CourtOption[] = [
  ...Array.from({ length: 10 }, (_, i) => court(String(i + 1), "clay")),
  ...Array.from({ length: 2 }, (_, i) => court(String(i + 11), "grass")),
];

/** @deprecated Use SEB_ARENA_COURTS */
export const SEB_ARENA_INDOOR_COURTS = SEB_ARENA_COURTS;

const CLUB_COURTS: Record<string, CourtOption[]> = {
  "seb-arena": SEB_ARENA_COURTS,
  "seb-bernardinai": BERNARDAINAI_COURTS,
};

const SURFACE_ORDER: Record<string, CourtSurface[]> = {
  "seb-arena": ["hard", "carpet"],
  "seb-bernardinai": ["clay", "grass"],
};

export const COURT_ANY = "any" as const;

export type CourtValue = typeof COURT_ANY | string;

export type CityValue = (typeof CITIES)[number]["value"];

export type ClubLabelKey = "sebArena" | "bernardinai";

export function getClubLabelKey(club: string): ClubLabelKey | string {
  if (club === "seb-arena") return "sebArena";
  if (club === "seb-bernardinai") return "bernardinai";
  return club;
}

export function getCourtsForClub(club: string): CourtOption[] {
  return CLUB_COURTS[club] ?? [];
}

export function formatCourtLabel(courtOption: CourtOption, messages: CourtLabelMessages): string {
  return messages.courtWithSurface
    .replace("{name}", courtOption.name)
    .replace("{surface}", messages.surfaces[courtOption.surface]);
}

export function getCourtOptionsForClub(
  club: string,
  messages: CourtLabelMessages,
): { value: string; label: string; group?: string }[] {
  const courts = getCourtsForClub(club);
  const options: { value: string; label: string; group?: string }[] = [
    { value: COURT_ANY, label: messages.courtAny },
  ];

  for (const surface of SURFACE_ORDER[club] ?? []) {
    const groupLabel = messages.surfaceGroups[surface];
    for (const courtOption of courts.filter((c) => c.surface === surface)) {
      options.push({
        value: courtOption.id,
        label: formatCourtLabel(courtOption, messages),
        group: groupLabel,
      });
    }
  }

  return options;
}

export function getClubLabel(city: string, club: string): string {
  return CLUBS[city]?.find((c) => c.value === club)?.value ?? club;
}

export function getCityLabel(city: string): string {
  return CITIES.find((c) => c.value === city)?.label ?? city;
}

export function getCourtLabel(
  court: string,
  club: string,
  messages: CourtLabelMessages,
): string {
  if (court === COURT_ANY) return messages.courtAny;
  const match = getCourtsForClub(club).find((c) => c.id === court);
  if (match) return formatCourtLabel(match, messages);
  return court;
}

/** @deprecated Use getCourtOptionsForClub */
export const COURTS = [COURT_ANY, ...SEB_ARENA_COURTS.map((c) => c.id)] as const;
