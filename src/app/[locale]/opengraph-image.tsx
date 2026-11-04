import { getMessages, isValidLocale, defaultLocale } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderBrandImage } from "@/lib/og-image";

export const alt = "PlayTennis.lt";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isValidLocale(raw) ? raw : defaultLocale;
  const home = getMessages(locale).home;

  return renderBrandImage({
    eyebrow: home.badge,
    title: home.headlineLead,
    accent: home.headlineMark,
    subtitle: home.support,
  });
}
