import { defaultLocale, getMessages } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderBrandImage } from "@/lib/og-image";

export const alt = "PlayTennis.lt";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const home = getMessages(defaultLocale).home;
  return renderBrandImage({
    eyebrow: home.badge,
    title: home.headlineLead,
    accent: home.headlineMark,
    subtitle: home.support,
  });
}
