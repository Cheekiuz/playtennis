import type { Metadata } from "next";
import SubmitEventForm from "@/components/SubmitEventForm";
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
    title: messages.submit.metaTitle,
    description: messages.submit.metaDescription,
    alternates: {
      canonical: absoluteUrl(localePath(locale, "/submit")),
      languages: routeAlternates("/submit"),
    },
  };
}

export default async function SubmitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const messages = getMessages(locale);

  return (
    <SiteFrame locale={locale} messages={messages}>
      <div className="mx-auto max-w-xl pt-6">
        <h1 className="text-4xl font-bold tracking-tight">{messages.submit.title}</h1>
        <p className="mt-3 text-base leading-7 text-foreground/80">{messages.submit.body}</p>
        <div className="mt-8">
          <SubmitEventForm messages={messages} />
        </div>
      </div>
    </SiteFrame>
  );
}
