import Link from "next/link";
import BallRain from "@/components/BallRain";
import CourtHotkeys from "@/components/CourtHotkeys";
import HomeCourt from "@/components/HomeCourt";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TournamentCard from "@/components/TournamentCard";
import TournamentFilters from "@/components/TournamentFilters";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { canStillEnter } from "@/lib/tournaments/feed";
import { listEventPlaces, listTournaments } from "@/lib/tournaments/queries";
import type { TournamentRecord } from "@/lib/tournaments/types";

export default async function DiscoverHome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [upcoming, weekend, places] = await Promise.all([
    listTournaments({ page: 1 }, 12),
    listTournaments({ when: "this-weekend", page: 1 }, 8),
    listEventPlaces(locale),
  ]);
  const home = messages.home;
  const discover = messages.discover;
  const tournamentsHref = localePath(locale, "/tournaments");
  const submitHref = localePath(locale, "/submit");
  const weekendEvents = weekend.items.filter((event) => canStillEnter(event.publicRegistration)).slice(0, 3);
  const hasEvents = upcoming.ready && upcoming.total > 0;

  return (
    <div className="home-editorial relative min-h-screen overflow-x-clip">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />
      <CourtHotkeys />
      <BallRain />
      <SiteHeader courtHome />
      <main>
        <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 lg:px-12 lg:pb-16">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-[#eeeeed] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c1f100]" aria-hidden="true" />
              {home.badge}
            </p>
            <h1 className="text-balance text-[40px] font-extrabold leading-[1.05] tracking-tight text-[#111915] sm:text-6xl lg:text-[68px] lg:leading-[74px]">
              {home.headlineLead}{" "}
              <span className="underline decoration-[#c1f100] decoration-[8px] underline-offset-[8px]">{home.headlineMark}</span>
            </h1>
            <p className="max-w-2xl text-lg leading-7 text-[#434845]">{home.support}</p>
            <div className="flex flex-col items-start gap-3 pt-2">
              <Link
                href={tournamentsHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#151d19] px-6 text-sm font-bold text-[#c1f100] hover:bg-[#c1f100] hover:text-[#151d19]"
              >
                {home.findTournament}
              </Link>
              <p className="text-sm text-[#434845]">{home.quiet}</p>
            </div>
          </div>

          {hasEvents ? (
            <div id="find" className="mt-10 rounded-2xl border border-[#e2e2e2] bg-white p-4 sm:p-6">
              <h2 className="text-2xl font-bold tracking-tight text-[#111915]">{home.findTitle}</h2>
              <p className="mt-1 text-sm text-[#434845]">{home.wherePrompt}</p>
              <div className="mt-4">
                <TournamentFilters locale={locale} messages={messages} values={{}} places={places} appearance="paper" />
              </div>
            </div>
          ) : null}
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 lg:px-12" aria-label={home.surfaceFeed}>
          <HomeCourt messages={messages} />
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 py-12 lg:px-12 lg:py-16">
          {!upcoming.ready ? (
            <p className="text-sm text-[#434845]">{discover.loadError}</p>
          ) : hasEvents ? (
            weekendEvents.length > 0 ? (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2e2e2] pb-4 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#111915]">{home.whereTitle}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#434845]">{home.whereSupport}</p>
                  </div>
                  <Link href={tournamentsHref} className="text-sm font-bold text-[#1a1c1c] hover:text-[#506600]">
                    {home.viewCalendar}
                  </Link>
                </div>
                <EventGrid events={weekendEvents} locale={locale} messages={messages} />
              </div>
            ) : (
              <p className="text-base text-[#1a1c1c]">
                {home.weekendEmptyTitle}{" "}
                <Link href={tournamentsHref} className="font-bold underline-offset-2 hover:underline">
                  {home.weekendEmptyAction}
                </Link>
              </p>
            )
          ) : (
            <div className="max-w-2xl space-y-4 rounded-2xl border border-[#e2e2e2] bg-white p-6 sm:p-8">
              <h2 className="text-3xl font-bold tracking-tight text-[#111915]">{discover.buildingTitle}</h2>
              <p className="text-base leading-7 text-[#434845]">{discover.buildingBody}</p>
              <Link
                href={submitHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#151d19] px-5 text-sm font-bold text-[#c1f100]"
              >
                {home.submitAction}
              </Link>
            </div>
          )}
        </section>

        <section className="border-y border-[#e2e2e2] bg-[#f3f4f3] py-14 lg:py-20">
          <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 lg:grid-cols-12 lg:px-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#111915] sm:text-4xl">{discover.builtBy}</h2>
            </div>
            <div className="lg:col-span-7">
              <h3 className="text-xl font-bold text-[#111915]">{discover.independentTitle}</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#1a1c1c]">{discover.independentBody}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 py-14 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-[#111915] bg-[#151d19] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-xl space-y-2">
              <h2 className="text-xl font-bold text-[#c1f100]">{home.submitTitle}</h2>
              <p className="text-sm leading-6 text-[#d5ddd6]">{home.submitBody}</p>
            </div>
            <Link
              href={submitHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#c1f100] px-5 text-sm font-bold text-[#151d19] hover:bg-white"
            >
              {home.submitAction}
            </Link>
          </div>
        </section>

        <section className="border-t border-[#e2e2e2] bg-[#f3f4f3] py-10">
          <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-12">
            <h2 className="text-lg font-bold text-[#111915]">{home.waysTitle}</h2>
            <p className="mt-1 text-sm text-[#434845]">{home.waysLine}</p>
            <p className="mt-1 text-sm text-[#434845]">{home.waysSupport}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} messages={messages} variant="editorial" />
    </div>
  );
}

function EventGrid({
  events,
  locale,
  messages,
}: {
  events: TournamentRecord[];
  locale: Locale;
  messages: Messages;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} tone="paper" />
      ))}
    </div>
  );
}
