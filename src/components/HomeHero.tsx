import HeroRandomBall from "@/components/HeroRandomBall";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { Messages } from "@/lib/i18n";

export default function HomeHero({
  messages,
  tournamentHrefs = [],
}: {
  messages: Messages;
  tournamentHrefs?: string[];
}) {
  const home = messages.home;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 lg:px-12">
      <div className="grid overflow-hidden rounded-[32px] bg-[#0d2818] text-white lg:min-h-[420px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between gap-10 p-7 sm:p-9 lg:p-11">
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8ff00]">• {home.badge}</p>
            <h1 className="max-w-xl text-balance text-[40px] font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
              <span className="block text-white">{home.headlineLead}</span>
              <span className="block text-[#c8ff00]">{home.headlineMark}</span>
            </h1>
            <p className="max-w-md text-base leading-7 text-white/72 sm:text-lg">{home.support}</p>
            <a
              href="#play-next"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c8ff00] px-6 text-sm font-bold text-[#0d2818] hover:bg-white"
            >
              {home.findTournament} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/60">
            <span aria-hidden="true">✶</span>
            {home.quiet}
          </p>
        </div>

        <div className="relative min-h-[340px] overflow-hidden border-t border-white/10 bg-[#123526] sm:min-h-[380px] lg:min-h-full lg:border-l lg:border-t-0">
          <div className="pointer-events-none absolute -right-10 top-10 h-44 w-44 rounded-full bg-[#c8ff00]/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-16 left-8 h-32 w-32 rounded-full bg-[#c8ff00]/8 blur-2xl" aria-hidden="true" />

          <div className="absolute inset-x-5 top-5 z-20 flex items-start justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 sm:inset-x-7 sm:top-7">
            <span>{home.heroCaption}</span>
            <span className="tabular-nums text-[#c8ff00]">{home.heroScore}</span>
          </div>

          <div className="absolute inset-x-5 bottom-5 top-14 sm:inset-x-7 sm:bottom-7 sm:top-16">
            <div className="relative h-full w-full">
              <div
                className="absolute inset-0 rounded-[22px] border border-white/25 bg-[#1a4d35] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                aria-hidden="true"
              >
                <div className="absolute inset-y-[3%] left-[9%] right-[9%] rounded-[14px] border border-white/30" />
                <div className="absolute left-[9%] right-[9%] top-[24%] h-px bg-white/40" />
                <div className="absolute bottom-[24%] left-[9%] right-[9%] h-px bg-white/40" />
                <div className="absolute inset-x-[3%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/55 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
                <div className="absolute left-[2%] top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-sm bg-white/40" />
                <div className="absolute right-[2%] top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-sm bg-white/40" />
                <div className="absolute left-1/2 top-[24%] h-[26%] w-px -translate-x-1/2 bg-white/35" />
                <div className="absolute bottom-[24%] left-1/2 h-[26%] w-px -translate-x-1/2 bg-white/35" />
              </div>

              <div className="absolute left-1/2 top-[40%] z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_22px_36px_rgba(0,0,0,0.5)]">
                <HeroRandomBall hrefs={tournamentHrefs} label={home.findTournament}>
                  <TennisBallIcon size={128} priority variant="cta" />
                </HeroRandomBall>
              </div>

              <a
                href="#play-next"
                className="absolute bottom-3 right-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0d2818]/75 text-lg text-[#c8ff00] backdrop-blur hover:bg-[#0d2818] sm:bottom-4 sm:right-4"
                aria-label={home.findTournament}
              >
                ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
