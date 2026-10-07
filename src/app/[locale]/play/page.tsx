import type { Metadata } from "next";
import RallyGame from "@/components/RallyGame";
import SiteFrame from "@/components/SiteFrame";
import { getMessages, isValidLocale, localePath } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = getMessages(locale);
  return {
    title: messages.play.metaTitle,
    description: messages.play.metaDescription,
    alternates: {
      canonical: absoluteUrl(localePath(locale, "/play")),
      languages: routeAlternates("/play"),
    },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const messages = getMessages(locale);

  return (
    <SiteFrame locale={locale} messages={messages}>
      <h1 className="text-4xl font-bold tracking-tight">{messages.play.title}</h1>
      <p className="mt-3 max-w-xl text-base text-foreground/80">{messages.play.intro}</p>
      <div className="mt-8">
        <RallyGame messages={messages} findHref={localePath(locale, "/tournaments")} />
      </div>
    </SiteFrame>
  );
}
