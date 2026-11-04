import { JsonLd } from "@/components/JsonLd";
import { localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import {
  breadcrumbNode,
  collectionPageNode,
  faqNode,
  graph,
  type FaqItem,
} from "@/lib/structured-data";
import type { TournamentRecord } from "@/lib/tournaments/types";

/** Breadcrumb + CollectionPage/ItemList (+ optional FAQPage) for a canonical listing page. */
export default function ListingJsonLd({
  locale,
  path,
  name,
  description,
  items,
  crumbs,
  faq,
}: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  items: TournamentRecord[];
  crumbs: { name: string; path: string }[];
  faq?: FaqItem[];
}) {
  const dateModified = items.reduce<string | null>(
    (latest, item) => (!latest || item.updatedAt > latest ? item.updatedAt : latest),
    null,
  );
  return (
    <JsonLd
      data={graph(
        breadcrumbNode(crumbs, locale),
        collectionPageNode({
          locale,
          path,
          name,
          description,
          dateModified,
          items: items.map((item) => ({
            name: item.name,
            url: absoluteUrl(localePath(locale, `/tournaments/${item.slug}`)),
          })),
        }),
        faq ? faqNode(faq, locale) : null,
      )}
    />
  );
}

export function latestUpdate(items: TournamentRecord[]): string | null {
  return items.reduce<string | null>((latest, item) => (!latest || item.updatedAt > latest ? item.updatedAt : latest), null);
}
