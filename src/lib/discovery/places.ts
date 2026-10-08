/** Country pages are indexable only when there is enough real upcoming coverage. */
export const MIN_INDEXABLE_PLACE_EVENTS = 3;

const BALTICS = new Set(["lt", "lv", "ee"]);
const EUROPE = new Set([
  "al", "ad", "at", "by", "be", "ba", "bg", "hr", "cy", "cz", "dk", "fi", "fr", "de", "gr", "hu", "is", "ie", "it",
  "xk", "li", "lu", "mt", "md", "mc", "me", "nl", "mk", "no", "pl", "pt", "ro", "sm", "rs", "sk", "si", "es", "se",
  "ch", "ua", "gb", "va",
]);
const NORTH_AMERICA = new Set(["us", "ca", "mx"]);
const SOUTH_AMERICA = new Set(["ar", "bo", "br", "cl", "co", "ec", "gy", "py", "pe", "sr", "uy", "ve"]);
const ASIA = new Set(["jp", "cn", "kr", "in", "sg", "th", "my", "id", "ph", "vn", "ae", "il", "tr", "kz"]);
const OCEANIA = new Set(["au", "nz"]);
const AFRICA = new Set(["za", "eg", "ma", "ke", "ng", "tn"]);

export type CatalogRegion = "baltics" | "europe" | "north_america" | "south_america" | "asia" | "oceania" | "africa" | "world";

export function countrySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function countryCatalogRegion(code: string): CatalogRegion {
  const country = code.toLowerCase();
  if (BALTICS.has(country)) return "baltics";
  if (EUROPE.has(country)) return "europe";
  if (NORTH_AMERICA.has(country)) return "north_america";
  if (SOUTH_AMERICA.has(country)) return "south_america";
  if (ASIA.has(country)) return "asia";
  if (OCEANIA.has(country)) return "oceania";
  if (AFRICA.has(country)) return "africa";
  return "world";
}
