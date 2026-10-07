import Link from "next/link";
import CourtHotkeys from "@/components/CourtHotkeys";
import MarketingPageShell from "@/components/MarketingPageShell";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SurfaceButton from "@/components/SurfaceButton";
import TournamentCard from "@/components/TournamentCard";
import TournamentFilters from "@/components/TournamentFilters";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { COUNTRIES, DESTINATION_CODES, countryName } from "@/lib/tournaments/countries";
import { listTournaments } from "@/lib/tournaments/queries";

export default async function DiscoverHome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [upcoming, weekend] = await Promise.all([
    listTournaments({ page: 1 }, 4),
    listTournaments({ when: "this-weekend", page: 1 }, 4),
  ]);
  const d = messages.discover;
  const nearCodes = ["lt", "lv", "ee"];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <CourtHotkeys />
      <MarketingPageShell header={<SiteHeader courtHome />}>
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center pt-6 text-center sm:pt-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">{d.headline}</h1>
          <p className="mt-4 max-w-xl text-base text-foreground/80 sm:text-lg">{d.subhead}</p>
          <div className="mt-8 w-full border border-border bg-card/80 p-4 text-left sm:p-5">
            <TournamentFilters locale={locale} messages={messages} values={{}} showSearch={false} allowMore={false} />
          </div>
          <div className="mt-4 flex flex-col items-center gap-3">
            <SurfaceButton label={d.surfaceChange} />
            <p className="font-mono text-xs text-foreground/70">
              <span className="hidden sm:inline">
                {messages.tip.press} T {messages.tip.ballStorm}. {messages.tip.clayMode}
              </span>
              <span className="sm:hidden">{messages.tip.surfaceMobile}</span>
            </p>
          </div>
        </section>

        <HomeSection title={d.upcoming} href={localePath(locale, "/tournaments")} linkLabel={d.browseAll}>
          <CardGrid tournaments={upcoming.items} locale={locale} messages={messages} empty={d.empty} />
        </HomeSection>

        <HomeSection
          title={d.weekendTitle}
          href={`${localePath(locale, "/tournaments")}?when=this-weekend`}
          linkLabel={d.browseAll}
        >
          <CardGrid tournaments={weekend.items} locale={locale} messages={messages} empty={d.empty} />
        </HomeSection>

        <section className="mx-auto mt-14 w-full max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight">{d.nearYou}</h2>
          <p className="mt-2 text-sm text-foreground/70">{d.nearHint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {nearCodes.map((code) => (
              <CountryChip key={code} locale={locale} code={code} />
            ))}
            {COUNTRIES.filter((country) => country.priority === 1 && !nearCodes.includes(country.code)).slice(0, 4).map((country) => (
              <CountryChip key={country.code} locale={locale} code={country.code} />
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 w-full max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight">{d.destinations}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {DESTINATION_CODES.map((code) => (
              <CountryChip key={code} locale={locale} code={code} />
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid w-full max-w-6xl gap-4 sm:grid-cols-2">
          <Link href={localePath(locale, "/play")} className="border border-border bg-card/80 p-5 hover:border-accent">
            <h2 className="text-xl font-bold">{messages.play.title}</h2>
            <p className="mt-2 text-sm text-foreground/75">{messages.play.intro}</p>
          </Link>
          <Link href={localePath(locale, "/quiz")} className="border border-border bg-card/80 p-5 hover:border-accent">
            <h2 className="text-xl font-bold">{messages.quiz.title}</h2>
            <p className="mt-2 text-sm text-foreground/75">{messages.quiz.intro}</p>
          </Link>
        </section>

        <section className="mx-auto mt-16 w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">{d.aboutTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/80">{d.aboutBody}</p>
        </section>

        <SiteFooter locale={locale} messages={messages} />
      </MarketingPageShell>
    </div>
  );
}

function HomeSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-14 w-full max-w-6xl">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-accent hover:underline">
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function CardGrid({
  tournaments,
  locale,
  messages,
  empty,
}: {
  tournaments: Awaited<ReturnType<typeof listTournaments>>["items"];
  locale: Locale;
  messages: Messages;
  empty: string;
}) {
  if (tournaments.length === 0) {
    return <p className="text-sm text-foreground/70">{empty}</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
      ))}
    </div>
  );
}

function CountryChip({ locale, code }: { locale: Locale; code: string }) {
  return (
    <Link
      href={`${localePath(locale, "/tournaments")}?country=${code}`}
      className="border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
    >
      {countryName(code, locale)}
    </Link>
  );
}
