import type { Metadata } from "next";
import SavedTournaments from "@/components/SavedTournaments";
import SiteFrame from "@/components/SiteFrame";
import { getMessages, isValidLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = getMessages(locale);
  return buildMetadata({
    locale,
    path: "/saved",
    title: messages.discover.savedTitle,
    description: messages.discover.savedNote,
    noindex: true,
    follow: false,
  });
}

export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const messages = getMessages(locale);

  return (
    <SiteFrame locale={locale} messages={messages}>
      <h1 className="text-4xl font-bold tracking-tight">{messages.discover.savedTitle}</h1>
      <p className="mt-3 max-w-xl text-sm text-foreground/70">{messages.discover.savedNote}</p>
      <div className="mt-8">
        <SavedTournaments locale={locale} messages={messages} />
      </div>
    </SiteFrame>
  );
}
