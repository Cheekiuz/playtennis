export type CountryOption = {
  code: string;
  nameEn: string;
  nameLt: string;
  priority: 1 | 2 | 3;
};

export const COUNTRIES: CountryOption[] = [
  { code: "lt", nameEn: "Lithuania", nameLt: "Lietuva", priority: 1 },
  { code: "lv", nameEn: "Latvia", nameLt: "Latvija", priority: 1 },
  { code: "ee", nameEn: "Estonia", nameLt: "Estija", priority: 1 },
  { code: "pl", nameEn: "Poland", nameLt: "Lenkija", priority: 1 },
  { code: "se", nameEn: "Sweden", nameLt: "Švedija", priority: 1 },
  { code: "fi", nameEn: "Finland", nameLt: "Suomija", priority: 1 },
  { code: "de", nameEn: "Germany", nameLt: "Vokietija", priority: 1 },
  { code: "cz", nameEn: "Czech Republic", nameLt: "Čekija", priority: 1 },
  { code: "es", nameEn: "Spain", nameLt: "Ispanija", priority: 1 },
  { code: "it", nameEn: "Italy", nameLt: "Italija", priority: 1 },
  { code: "fr", nameEn: "France", nameLt: "Prancūzija", priority: 1 },
  { code: "hr", nameEn: "Croatia", nameLt: "Kroatija", priority: 2 },
];

export const DESTINATION_CODES = ["es", "it", "hr", "se"] as const;

export function countryName(code: string, locale: "lt" | "en"): string {
  const country = COUNTRIES.find((item) => item.code === code);
  if (country) return locale === "lt" ? country.nameLt : country.nameEn;
  return regionName(code, locale);
}

export function regionName(code: string, locale: "lt" | "en"): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return code;
  try {
    const name = new Intl.DisplayNames([locale === "lt" ? "lt" : "en"], { type: "region" }).of(normalized);
    if (name && name.toUpperCase() !== normalized) return name;
  } catch {
    // Ignore unsupported locales and fall through.
  }
  return normalized;
}

export function countryCodeFromName(query: string): string | null {
  const needle = query.trim().toLowerCase();
  if (needle.length < 4) return null;
  const index = countryNameIndex();
  const exact = index.get(needle);
  if (exact) return exact;
  for (const [name, code] of index) {
    if (name.startsWith(needle)) return code;
  }
  return null;
}

let countryNames: Map<string, string> | null = null;

function countryNameIndex(): Map<string, string> {
  if (countryNames) return countryNames;
  const names = new Map<string, string>();
  const english = new Intl.DisplayNames(["en"], { type: "region" });
  const lithuanian = new Intl.DisplayNames(["lt"], { type: "region" });
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const lower = code.toLowerCase();
      for (const display of [english, lithuanian]) {
        const name = display.of(code);
        if (!name || name.toUpperCase() === code) continue;
        names.set(name.toLowerCase(), lower);
      }
    }
  }
  countryNames = names;
  return names;
}

export function flagEmoji(code: string): string {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(...[...normalized].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)));
}
