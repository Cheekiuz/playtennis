import type { Metadata } from "next";
import CatalogSectionPage from "@/components/CatalogSectionPage";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import type { CatalogWhen } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = getMessages(locale);
  const path = localePath(locale, "/baltics");
  return {
    title: `${messages.catalog.baltics.title} | PlayTennis.lt`,
    description: messages.catalog.baltics.description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: routeAlternates("/baltics"),
    },
  };
}

export default async function BalticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) return null;
  const locale: Locale = raw;
  const messages = getMessages(locale);
  const query = await searchParams;
  const when: CatalogWhen = one(query.when) === "past" ? "past" : "upcoming";
  const page = Math.max(1, Number(one(query.page) ?? "1") || 1);

  return <CatalogSectionPage locale={locale} messages={messages} section="baltics" when={when} page={page} />;
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
