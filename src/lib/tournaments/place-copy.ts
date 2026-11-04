import type { Locale, Messages } from "@/lib/i18n";
import { clampDescription } from "@/lib/seo";
import type { FaqItem } from "@/lib/structured-data";
import { formatDay, surfaceLabel } from "@/lib/tournaments/present";
import type { TournamentRecord } from "@/lib/tournaments/types";

export type PlaceSummary = {
  count: number;
  next: TournamentRecord | null;
  surfaces: string[];
  intro: string;
  metaDescription: string;
  faq: FaqItem[];
  lastUpdated: string | null;
  geo: { lat: number; lng: number } | null;
};

/** Facts and answer-first copy for a country or city page, derived only from real listed events. */
export function summarisePlace(input: {
  place: string;
  total: number;
  items: TournamentRecord[];
  locale: Locale;
  messages: Messages;
  withGeo: boolean;
}): PlaceSummary {
  const { place, total, items, locale, messages } = input;
  const s = messages.seo;
  const sorted = [...items].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const next = sorted[0] ?? null;
  const surfaces = [...new Set(items.map((item) => item.surface).filter((surface) => surface && surface !== "unknown"))].map((surface) =>
    surfaceLabel(surface, messages),
  );
  const nextDate = next ? formatDay(next.startsOn, locale) : "";

  const intro = next
    ? [
        s.placeIntro
          .replace("{count}", String(total))
          .replace("{place}", place)
          .replace("{name}", next.name)
          .replace("{date}", nextDate),
        surfaces.length > 0 ? s.placeSurfaces.replace("{surfaces}", surfaces.join(", ")) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : messages.discover.placeDescription.replace("{place}", place);

  const metaDescription = clampDescription(
    next
      ? s.placeMetaDescription.replace("{count}", String(total)).replace("{place}", place).replace("{date}", nextDate)
      : messages.discover.placeDescription.replace("{place}", place),
  );

  const faq: FaqItem[] = [];
  if (next) {
    faq.push({
      question: s.faqPlaceNextQ.replace("{place}", place),
      answer: s.faqPlaceNextA.replace("{place}", place).replace("{name}", next.name).replace("{date}", nextDate),
    });
  }
  faq.push({
    question: s.faqPlaceCountQ.replace("{place}", place),
    answer: s.faqPlaceCountA.replace("{place}", place).replace("{count}", String(total)),
  });
  if (surfaces.length > 0) {
    faq.push({
      question: s.faqPlaceSurfaceQ.replace("{place}", place),
      answer: s.faqPlaceSurfaceA.replace("{place}", place).replace("{surfaces}", surfaces.join(", ")),
    });
  }
  faq.push({
    question: s.faqPlaceRegisterQ.replace("{place}", place),
    answer: s.faqPlaceRegisterA,
  });

  const lastUpdated = items.reduce<string | null>((latest, item) => (!latest || item.updatedAt > latest ? item.updatedAt : latest), null);

  const located = input.withGeo ? items.filter((item) => item.latitude != null && item.longitude != null) : [];
  const geo =
    located.length > 0
      ? {
          lat: located.reduce((sum, item) => sum + (item.latitude as number), 0) / located.length,
          lng: located.reduce((sum, item) => sum + (item.longitude as number), 0) / located.length,
        }
      : null;

  // Localised dates can end with a period ("14 d."), so templates may produce "..".
  const tidy = (text: string) => text.replace(/\.{2,}/g, ".");
  return {
    count: total,
    next,
    surfaces,
    intro: tidy(intro),
    metaDescription,
    faq: faq.map((item) => ({ question: tidy(item.question), answer: tidy(item.answer) })),
    lastUpdated,
    geo,
  };
}

export function siteFaq(messages: Messages): FaqItem[] {
  return messages.faq.items.map((item) => ({ question: item.q, answer: item.a }));
}
