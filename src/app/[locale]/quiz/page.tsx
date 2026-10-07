import type { Metadata } from "next";
import Link from "next/link";
import QuizFlow from "@/components/QuizFlow";
import SiteFrame from "@/components/SiteFrame";
import TournamentCard from "@/components/TournamentCard";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import { listTournaments } from "@/lib/tournaments/queries";
import type { TournamentFilters } from "@/lib/tournaments/types";

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
    const result = await listTournaments(filtersFromAnswers(answers), 8);
    return (
      <SiteFrame locale={locale} messages={messages}>
        <p className="text-sm font-semibold text-accent">{personality(answers, messages)}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{messages.quiz.resultTitle}</h1>
        {result.items.length === 0 ? (
          <p className="mt-6 text-sm text-foreground/70">{messages.quiz.empty}</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {result.items.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
            ))}
          </div>
        )}
        <div className="mt-8 flex gap-4 text-sm font-semibold">
          <Link href={localePath(locale, "/quiz")} className="text-accent hover:underline">
            {messages.quiz.again}
          </Link>
          <Link href={localePath(locale, "/tournaments")} className="text-accent hover:underline">
            {messages.quiz.browse}
          </Link>
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

function filtersFromAnswers(answers: { travel: string; format: string; surface: string; age: string; mood: string }): TournamentFilters {
  const filters: TournamentFilters = { page: 1 };
  if (answers.surface === "clay" || answers.surface === "hard" || answers.surface === "grass") {
    filters.surface = answers.surface;
  }
  if (answers.format === "singles" || answers.format === "doubles") filters.discipline = answers.format;
  if (answers.age === "40" || answers.age === "50" || answers.age === "u18") filters.age = answers.age;
  if (answers.mood === "serious") filters.audience = "masters";
  if (answers.mood === "social" || answers.mood === "holiday") filters.audience = "recreational";
  if (answers.travel === "trip") filters.when = "next-weekend";
  return filters;
}

function personality(
  answers: { travel: string; format: string; surface: string; mood: string },
  messages: ReturnType<typeof getMessages>,
): string {
  const names = messages.quiz.personalities;
  if (answers.mood === "holiday") return names.aperol;
  if (answers.surface === "clay") return names.clay;
  if (answers.mood === "serious") return names.beast;
  if (answers.format === "doubles" || answers.mood === "social") return names.social;
  if (answers.travel === "anywhere" || answers.travel === "trip") return names.tourist;
  return names.warrior;
}
