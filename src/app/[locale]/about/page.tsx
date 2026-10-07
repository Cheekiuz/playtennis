import type { Metadata } from "next";
import Link from "next/link";
import IndependenceNote from "@/components/IndependenceNote";
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
      <div className="mx-auto flex max-w-xl flex-col items-center pt-6 text-center">
        <p className="text-sm font-semibold tracking-wide text-foreground/60">{messages.discover.brand}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{messages.discover.headline}</h1>
        <p className="mt-4 text-base font-medium">{messages.discover.builtBy}</p>
        <IndependenceNote messages={messages} className="mt-10" />
        <Link
          href={localePath(locale, "/tournaments")}
          className="btn-primary btn-glow mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          {messages.discover.explore}
        </Link>
      </div>
    </SiteFrame>
  );
}
