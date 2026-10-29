import type { Metadata } from "next";
import DiscoverHome from "@/components/DiscoverHome";
import { getMessages, isValidLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { isCatalogSection } from "@/lib/tournaments/catalog";
import type { CatalogWhen } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildPageMetadata(locale);
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const query = await searchParams;
  const sectionRaw = one(query.section);
  const section = isCatalogSection(sectionRaw) ? sectionRaw : "lithuania";
  const when: CatalogWhen = one(query.when) === "past" ? "past" : "upcoming";

  return (
    <DiscoverHome
      locale={locale}
      messages={getMessages(locale)}
      section={section}
      when={when}
      filterValues={{
        q: one(query.q),
        country: one(query.country),
        city: one(query.city),
        format: one(query.format),
        surface: one(query.surface),
        playLevel: one(query.playLevel),
        age: one(query.age),
      }}
    />
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
