import type { CatalogSection } from "@/lib/tournaments/types";

export const CATALOG_SECTION_PATHS: Record<CatalogSection, string> = {
  lithuania: "/lithuania",
  baltics: "/baltics",
  itf: "/itf",
};

export function isCatalogSection(value: string | null | undefined): value is CatalogSection {
  return value === "lithuania" || value === "baltics" || value === "itf";
}

/** Assign browse section from explicit value or country. */
export function catalogSectionForCountry(
  countryCode: string | null | undefined,
  explicit?: CatalogSection | null,
): CatalogSection | null {
  if (explicit) return explicit;
  const code = countryCode?.trim().toLowerCase();
  if (code === "lt") return "lithuania";
  if (code === "lv" || code === "ee") return "baltics";
  return null;
}
