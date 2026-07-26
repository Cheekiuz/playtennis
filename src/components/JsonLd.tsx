import type { Locale } from "@/lib/i18n";
import { buildWebsiteJsonLd } from "@/lib/seo";

type JsonLdProps = {
  locale: Locale;
};

export function JsonLd({ locale }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteJsonLd(locale)) }}
    />
  );
}
