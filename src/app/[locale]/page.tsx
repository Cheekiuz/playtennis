import type { Metadata } from "next";
import DiscoverHome from "@/components/DiscoverHome";
import { getMessages, isValidLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  return <DiscoverHome locale={locale} messages={getMessages(locale)} />;
}
