import type { Metadata } from "next";
import Link from "next/link";
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
    title: messages.discover.aboutMetaTitle,
    description: messages.discover.aboutMetaDescription,
    alternates: {
      canonical: absoluteUrl(localePath(locale, "/about")),
      languages: routeAlternates("/about"),
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const messages = getMessages(locale);

  return (
    <SiteFrame locale={locale} messages={messages}>
      <h1 className="text-4xl font-bold tracking-tight">{messages.discover.aboutTitle}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">{messages.discover.aboutBody}</p>
      <Link
        href={localePath(locale, "/tournaments")}
        className="btn-primary btn-glow mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
      >
        {messages.discover.explore}
      </Link>
    </SiteFrame>
  );
}
