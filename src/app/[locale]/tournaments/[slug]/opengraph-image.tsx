import { defaultLocale, getMessages, isValidLocale } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderBrandImage } from "@/lib/og-image";
import { countryLabel, environmentLabel, formatDateRange, formatLabel, surfaceLabel } from "@/lib/tournaments/present";
import { getTournament } from "@/lib/tournaments/queries";

export const alt = "PlayTennis.lt tournament";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isValidLocale(raw) ? raw : defaultLocale;
  const messages = getMessages(locale);
  const tournament = await getTournament(slug);

  if (!tournament) {
    return renderBrandImage({
      eyebrow: messages.home.badge,
      title: messages.home.headlineLead,
      accent: messages.home.headlineMark,
    });
  }

  const chips = [
    tournament.eventFormat !== "MULTIPLE" ? formatLabel(tournament.eventFormat, messages) : null,
    tournament.surface !== "unknown" ? surfaceLabel(tournament.surface, messages) : null,
    tournament.environment ? environmentLabel(tournament.environment, messages) : null,
    tournament.ageGroup,
  ].filter((chip): chip is string => Boolean(chip));

  return renderBrandImage({
    eyebrow: messages.discover.brand,
    title: tournament.name,
    subtitle: `${tournament.city}, ${countryLabel(tournament, locale)} · ${formatDateRange(tournament.startsOn, tournament.endsOn, locale)}`,
    chips,
  });
}
