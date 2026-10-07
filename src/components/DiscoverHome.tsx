import Link from "next/link";
import { Space_Grotesk, Syne } from "next/font/google";
import BallRain from "@/components/BallRain";
import CourtHotkeys from "@/components/CourtHotkeys";
import HomeCourt, { RainControl } from "@/components/HomeCourt";
import SaveButton from "@/components/SaveButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { SURFACE_APRON } from "@/lib/court-draw";
import { COUNTRIES } from "@/lib/tournaments/countries";
import {
  categorySummary,
  countryLabel,
  formatDateRange,
  lifecycleLabel,
  lowestFee,
  registrationLabel,
  surfaceLabel,
} from "@/lib/tournaments/present";
import { listTournaments } from "@/lib/tournaments/queries";
import type { TournamentRecord } from "@/lib/tournaments/types";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  variable: "--font-home-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-text",
});

export default async function DiscoverHome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const upcoming = await listTournaments({ page: 1 }, 24);
  const cards = upcoming.items.slice(0, 4);
  const cities = [...new Set(upcoming.items.map((tournament) => tournament.city).filter(Boolean))].slice(0, 8);
  const home = messages.home;
  const discover = messages.discover;
  const tournamentsHref = localePath(locale, "/tournaments");

  return (
    <div className={`${syne.variable} ${spaceGrotesk.variable} home-editorial relative min-h-screen`}>
      <CourtHotkeys />
      <BallRain />
      <SiteHeader courtHome />
      <main>
        <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-8 lg:px-12 lg:pb-24">
          <div className="flex flex-col gap-10 lg:gap-14">
            <div className="flex flex-col justify-between gap-8 border-b border-[#e2e2e2] pb-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-[#eeeeed] px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#c1f100]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{home.badge}</span>
                </div>
                <h1 className="text-balance text-[40px] font-extrabold leading-[1.05] tracking-tight text-[#111915] sm:text-6xl lg:text-[72px] lg:leading-[76px]">
                  {home.headlineLead}{" "}
                  <br className="hidden sm:inline" />
                  <span className="underline decoration-[#c1f100] decoration-[8px] underline-offset-[8px]">{home.headlineMark}</span>
                </h1>
                <p className="max-w-2xl pt-2 text-lg leading-7 text-[#434845]">{home.support}</p>
              </div>
              <div className="flex min-w-[240px] flex-col items-start gap-3 lg:items-end">
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Link
                    href={tournamentsHref}
                    className="inline-flex items-center justify-center rounded-full bg-[#151d19] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#c1f100] transition-colors hover:bg-[#c1f100] hover:text-[#151d19]"
                  >
                    {home.findTournament}
                  </Link>
                  <Link
                    href="#ways"
                    className="inline-flex items-center justify-center rounded-full border border-[#c3c8c3] bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1a1c1c] hover:border-[#111915]"
                  >
                    {home.exploreTennis}
                  </Link>
                </div>
                <RainControl messages={messages} />
              </div>
            </div>
            <HomeCourt messages={messages} />
          </div>
        </section>

        <section className="border-y border-[#e2e2e2] bg-[#f3f4f3] py-14 lg:py-20">
          <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 lg:grid-cols-12 lg:gap-14 lg:px-12">
            <div className="space-y-4 lg:col-span-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#506600]">{home.ethos}</p>
              <h2 className="text-[28px] font-bold leading-tight tracking-tight text-[#111915] sm:text-[40px] sm:leading-[46px]">
                {discover.builtBy}
              </h2>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="rounded-xl border border-[#e2e2e2] bg-white p-6 sm:p-8">
                <div className="space-y-2 text-lg leading-7 text-[#1a1c1c]">
                  <p>{discover.independentTitle}</p>
                  <p>{discover.independentNotOrganise}</p>
                  <p>{discover.independentNotMemberships}</p>
                  <p>{discover.independentNotPromote}</p>
                  <p>{discover.independentBody}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {upcoming.ready ? <Stat value={String(upcoming.total)} label={home.listedLabel} /> : null}
                <Stat value={String(COUNTRIES.length)} label={home.countriesLabel} />
                <Stat value="0" label={home.biasLabel} accent />
              </div>
            </div>
          </div>
        </section>

        <section id="tournaments" className="scroll-mt-20 mx-auto w-full max-w-[1440px] px-4 py-16 lg:px-12 lg:py-24">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col justify-between gap-6 border-b border-[#e2e2e2] pb-6 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#506600]">{home.whereKicker}</p>
                <h2 className="text-[28px] font-bold tracking-tight text-[#111915] sm:text-[40px]">{home.whereTitle}</h2>
                <p className="mt-1 text-[15px] leading-6 text-[#434845]">{home.whereSupport}</p>
              </div>
              <Link href={tournamentsHref} className="text-sm font-bold text-[#1a1c1c] hover:text-[#506600]">
                {home.viewCalendar}
                {upcoming.ready ? ` (${upcoming.total})` : ""}
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <FilterChip href={tournamentsHref} active>
                {home.allSurfaces}
              </FilterChip>
              {(["clay", "hard", "grass"] as const).map((surface) => (
                <FilterChip key={surface} href={`${tournamentsHref}?surface=${surface}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: SURFACE_APRON[surface] }} />
                  {discover.surfaces[surface]}
                </FilterChip>
              ))}
              {cities.map((city) => (
                <FilterChip key={city} href={`${tournamentsHref}?city=${encodeURIComponent(city)}`}>
                  {city}
                </FilterChip>
              ))}
              <FilterChip href={`${tournamentsHref}?audience=recreational`}>{discover.audiences.recreational}</FilterChip>
              <FilterChip href={`${tournamentsHref}?audience=masters`}>{discover.audiences.masters}</FilterChip>
            </div>
            {cards.length === 0 ? (
              <p className="text-sm text-[#434845]">{discover.empty}</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((tournament) => (
                  <HomeTournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="ways" className="scroll-mt-20 border-t border-[#e2e2e2] bg-[#f3f4f3] py-16 lg:py-24">
          <div className="mx-auto w-full max-w-[1440px] space-y-10 px-4 lg:px-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#506600]">{home.waysKicker}</p>
              <h2 className="text-[28px] font-bold tracking-tight text-[#111915] sm:text-[40px]">{home.waysTitle}</h2>
              <p className="text-[15px] leading-6 text-[#434845]">{home.waysSupport}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Link
                href={tournamentsHref}
                className="flex flex-col justify-between rounded-xl border-2 border-[#111915] bg-white p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#506600]">{home.waysLive}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{home.waysTournamentsTitle}</h3>
                    <p className="mt-2 text-[13px] leading-5 text-[#434845]">{home.waysTournamentsBody}</p>
                  </div>
                </div>
                <p className="mt-6 border-t border-[#e2e2e2] pt-4 text-xs font-bold uppercase tracking-wider">
                  {home.waysTournamentsAction}
                </p>
              </Link>
              <SoonCard title={home.waysCourtsTitle} body={home.waysCourtsBody} soon={messages.nav.soon} />
              <SoonCard title={home.waysCoachesTitle} body={home.waysCoachesBody} soon={messages.nav.soon} />
              <SoonCard title={home.waysClubsTitle} body={home.waysClubsBody} soon={messages.nav.soon} />
            </div>
          </div>
        </section>

        <section id="why" className="scroll-mt-20 mx-auto w-full max-w-[1440px] space-y-12 px-4 py-16 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-between gap-6 border-b border-[#e2e2e2] pb-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#506600]">{home.whyKicker}</p>
              <h2 className="text-[28px] font-bold tracking-tight text-[#111915] sm:text-[40px]">{home.whyTitle}</h2>
            </div>
            <p className="max-w-md text-[13px] leading-5 text-[#434845]">{home.whySupport}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
            <WhyPoint index="01" title={home.whyOneTitle} body={home.whyOneBody} />
            <WhyPoint index="02" title={home.whyTwoTitle} body={home.whyTwoBody} />
            <WhyPoint index="03" title={home.whyThreeTitle} body={home.whyThreeBody} />
          </div>
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#111915] bg-[#151d19] p-8 text-center sm:flex-row sm:text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#c1f100]">{home.submitTitle}</h3>
              <p className="text-[13px] leading-5 text-[#7d8680]">{home.submitBody}</p>
            </div>
            <Link
              href={localePath(locale, "/about")}
              className="inline-flex whitespace-nowrap rounded-full bg-[#c1f100] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#151d19] hover:bg-white"
            >
              {home.submitAction}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} messages={messages} variant="editorial" />
    </div>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[#e2e2e2] bg-white p-4">
      <span className={`block text-[28px] font-bold leading-none tabular-nums ${accent ? "text-[#506600]" : "text-[#111915]"}`}>
        {value}
      </span>
      <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.06em] text-[#434845]">{label}</span>
    </div>
  );
}

function FilterChip({ href, active = false, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
        active
          ? "bg-[#111915] text-[#c1f100]"
          : "border border-[#e2e2e2] bg-white text-[#1a1c1c] hover:border-[#111915]"
      }`}
    >
      {children}
    </Link>
  );
}

function SoonCard({ title, body, soon }: { title: string; body: string; soon: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#e2e2e2] bg-white p-6">
      <div>
        <span className="inline-flex rounded bg-[#eeeeed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434845]">
          {soon}
        </span>
        <h3 className="mt-4 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-[13px] leading-5 text-[#434845]">{body}</p>
      </div>
    </div>
  );
}

function WhyPoint({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold tabular-nums text-[#506600]">{index} /</p>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-[15px] leading-6 text-[#434845]">{body}</p>
    </div>
  );
}

function HomeTournamentCard({
  tournament,
  locale,
  messages,
}: {
  tournament: TournamentRecord;
  locale: Locale;
  messages: Messages;
}) {
  const href = localePath(locale, `/tournaments/${tournament.slug}`);
  const fee = lowestFee(tournament.categories, locale, messages.discover.fromFee);
  const summary = categorySummary(tournament.categories, messages);
  const place = [tournament.city, countryLabel(tournament, locale), tournament.venueName].filter(Boolean).join(" · ");
  const badge = SURFACE_APRON[tournament.surface as keyof typeof SURFACE_APRON] ?? "#2b2d2f";
  const registration =
    tournament.registrationStatus === "unknown"
      ? lifecycleLabel(tournament.lifecycleStatus, messages)
      : registrationLabel(tournament.registrationStatus, messages);

  return (
    <article className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[#e2e2e2] bg-white">
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e2e2] bg-[#f3f4f3] p-4">
          <span className="rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: badge }}>
            {surfaceLabel(tournament.surface, messages)}
          </span>
          <span className="text-xs font-bold tabular-nums text-[#434845]">
            {formatDateRange(tournament.startsOn, tournament.endsOn, locale)}
          </span>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#434845]">{place}</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight">
                <Link href={href} className="hover:text-[#506600]">
                  {tournament.name}
                </Link>
              </h3>
            </div>
            <SaveButton
              id={tournament.id}
              saveLabel={messages.discover.save}
              savedLabel={messages.discover.saved}
              unsaveLabel={messages.discover.unsave}
              paper
            />
          </div>
          {summary ? <p className="text-sm text-[#434845]">{summary}</p> : null}
          <p className="text-sm text-[#1a1c1c]">{registration}</p>
          {fee ? <p className="text-sm text-[#434845]">{fee}</p> : null}
        </div>
      </div>
      <div className="px-5 pb-5">
        <Link
          href={href}
          className="flex w-full items-center justify-center rounded-lg border border-[#e2e2e2] bg-[#eeeeed] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#1a1c1c] hover:border-[#111915] hover:bg-[#111915] hover:text-[#c1f100]"
        >
          {messages.discover.view}
        </Link>
      </div>
    </article>
  );
}
