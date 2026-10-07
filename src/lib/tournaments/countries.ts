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
  if (!country) return code.toUpperCase();
  return locale === "lt" ? country.nameLt : country.nameEn;
}

export function flagEmoji(code: string): string {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(...[...normalized].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)));
}
