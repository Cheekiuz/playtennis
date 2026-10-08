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
  const about = messages.about;

  return (
    <SiteFrame locale={locale} messages={messages}>
      <div className="mx-auto flex max-w-xl flex-col pt-6">
        <p className="text-sm font-semibold text-foreground/70">{messages.discover.brand}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{messages.discover.builtBy}</h1>
        <h2 className="mt-10 text-2xl font-bold tracking-tight">{messages.discover.independentTitle}</h2>
        <p className="mt-3 text-base leading-7 text-foreground/80">{messages.discover.independentBody}</p>

        <h2 className="mt-10 text-2xl font-bold tracking-tight">{about.howTitle}</h2>
        <ol className="mt-4 grid gap-3">
          {about.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-base">
              <span className="font-bold text-accent">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <Link
          href={localePath(locale, "/tournaments")}
          className="btn-primary mt-8 inline-flex min-h-11 w-fit items-center rounded-full px-5 text-sm font-semibold"
        >
          {messages.home.findTournament}
        </Link>

        <section id="contact" className="mt-14 scroll-mt-24 border-t border-border pt-8">
          <h2 className="text-2xl font-bold">{about.contactTitle}</h2>
          <p className="mt-3 text-base leading-7 text-foreground/80">{about.contactBody}</p>
          <Link href={localePath(locale, "/submit")} className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent underline-offset-2 hover:underline">
            {messages.nav.submit}
          </Link>
        </section>
      </div>
    </SiteFrame>
  );
}
