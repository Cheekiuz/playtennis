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
      <div className="grid overflow-hidden rounded-[32px] bg-[#0d2818] text-white lg:min-h-[360px] lg:grid-cols-[1.05fr_0.95fr]">
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

        <div className="relative overflow-hidden border-t border-white/10 bg-[#123526] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
          <div className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-[#c8ff00]/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-8 left-6 h-28 w-28 rounded-full bg-[#c8ff00]/8 blur-2xl" aria-hidden="true" />

          <div className="relative flex items-start justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
            <span>{home.heroCaption}</span>
            <span className="tabular-nums text-[#c8ff00]">{home.heroScore}</span>
          </div>

          <div className="relative mt-8 flex flex-1 flex-col items-center justify-center">
            <div className="relative flex h-52 w-full max-w-md items-end justify-center pb-4">
              <div
                className="absolute inset-x-4 bottom-0 h-36 rounded-[28px] border border-white/15 bg-[#1a4d35] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                aria-hidden="true"
              >
                <div className="absolute inset-x-[18%] top-1/2 h-px bg-white/40" />
                <div className="absolute inset-y-[18%] left-1/2 w-px bg-white/30" />
                <div className="absolute inset-x-[10%] top-[18%] bottom-[18%] rounded-2xl border border-white/20" />
                <div className="absolute left-[10%] right-[10%] top-1/2 h-px -translate-y-1/2 bg-white/25" />
              </div>
              <div className="relative z-10 mb-10 drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]">
                <HeroRandomBall hrefs={tournamentHrefs} label={home.findTournament}>
                  <TennisBallIcon size={120} priority variant="cta" />
                </HeroRandomBall>
              </div>
              <a
                href="#play-next"
                className="absolute bottom-2 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0d2818]/70 text-lg text-[#c8ff00] backdrop-blur hover:bg-[#0d2818]"
                aria-label={home.findTournament}
              >
                ↗
              </a>
            </div>
            <div className="mt-5 max-w-sm space-y-1 text-center">
              <p className="text-sm font-semibold leading-6 text-white/85">{home.heroVisualHint}</p>
              <p className="text-sm leading-6 text-white/60">{home.heroVisualHintSecondary}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
