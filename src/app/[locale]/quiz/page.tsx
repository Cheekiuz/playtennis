import type { Metadata } from "next";
import Link from "next/link";
import QuizFlow from "@/components/QuizFlow";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import { matchReasons } from "@/lib/tournaments/match";
import { listTournaments } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = getMessages(locale);
  const done = (await searchParams).done === "1";
  return {
    title: messages.quiz.metaTitle,
    description: messages.quiz.metaDescription,
    alternates: {
      canonical: absoluteUrl(localePath(locale, "/quiz")),
      languages: routeAlternates("/quiz"),
    },
    robots: done ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function QuizPage({
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

  if (query.done === "1") {
    const answers = {
      travel: one(query.travel),
      format: one(query.format),
      surface: one(query.surface),
      age: one(query.age),
      mood: one(query.mood),
    };
    const result = await listTournaments({ page: 1 }, 80);
    const matches = result.items
      .map((tournament) => ({ tournament, ...matchReasons(tournament, answers, messages) }))
      .filter((item) => item.matched)
      .sort((a, b) => b.reasons.length - a.reasons.length)
      .slice(0, 6);
    return (
      <SiteFrame locale={locale} messages={messages}>
        <h1 className="text-4xl font-bold tracking-tight">{messages.quiz.resultTitle}</h1>
        {!result.ready ? (
          <p className="mt-6 text-base text-foreground/80">{messages.discover.loadError}</p>
        ) : matches.length === 0 ? (
          <div className="mt-6 max-w-xl space-y-4">
            <p className="text-base text-foreground/80">{messages.quiz.empty}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={localePath(locale, "/tournaments")} className="btn-primary inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold">
                {messages.quiz.browse}
              </Link>
              <Link href={localePath(locale, "/submit")} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-accent underline-offset-2 hover:underline">
                {messages.quiz.submit}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {matches.map(({ tournament, reasons }) => (
              <div key={tournament.id} className="grid gap-3">
                <TournamentCard tournament={tournament} locale={locale} messages={messages} />
                {reasons.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold">{messages.quiz.because}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-foreground/80">
                      {reasons.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <span aria-hidden="true">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href={localePath(locale, "/quiz")} className="inline-flex min-h-11 items-center text-accent hover:underline">
            {messages.quiz.again}
          </Link>
          {matches.length > 0 ? (
            <Link href={localePath(locale, "/tournaments")} className="inline-flex min-h-11 items-center text-accent hover:underline">
              {messages.quiz.browse}
            </Link>
          ) : null}
        </div>
      </SiteFrame>
    );
  }

  return (
    <SiteFrame locale={locale} messages={messages}>
      <h1 className="text-4xl font-bold tracking-tight">{messages.quiz.title}</h1>
      <p className="mt-3 max-w-xl text-base text-foreground/80">{messages.quiz.intro}</p>
      <div className="mt-8">
        <QuizFlow messages={messages} action={localePath(locale, "/quiz")} />
      </div>
    </SiteFrame>
  );
}

function one(value: string | string[] | undefined): string {
  const text = Array.isArray(value) ? value[0] : value;
  return text ?? "";
}

