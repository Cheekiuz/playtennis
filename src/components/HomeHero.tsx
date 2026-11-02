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
      <div className="grid overflow-hidden rounded-[32px] bg-[#0d2818] text-white lg:min-h-[400px] lg:grid-cols-[1.05fr_0.95fr]">
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
          <div className="pointer-events-none absolute -right-8 top-6 h-44 w-44 rounded-full bg-[#c8ff00]/14 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-10 left-4 h-32 w-32 rounded-full bg-[#c8ff00]/10 blur-2xl" aria-hidden="true" />

          <div className="relative flex items-start justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
            <span>{home.heroCaption}</span>
            <span className="tabular-nums text-[#c8ff00]">{home.heroScore}</span>
          </div>

          <div className="relative mt-6 flex flex-1 flex-col items-center justify-center">
            <div className="relative flex w-full max-w-md flex-col items-center">
              {/* Landscape court (length left-right, net vertical) */}
              <div className="relative w-full" style={{ aspectRatio: "23.77 / 10.97" }}>
                <div className="absolute inset-0 overflow-hidden rounded-[22px] border border-white/20 bg-[#1a4d35] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <HorizontalCourtLines />
                </div>

                {/* Ball sits on / above the court */}
                <div className="absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_22px_40px_rgba(0,0,0,0.55)]">
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8ff00]/20 blur-3xl"
                    aria-hidden="true"
                  />
                  <HeroRandomBall hrefs={tournamentHrefs} label={home.findTournament}>
                    <TennisBallIcon size={148} priority variant="cta" />
                  </HeroRandomBall>
                </div>

                <a
                  href="#play-next"
                  className="absolute bottom-3 right-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0d2818]/75 text-lg text-[#c8ff00] backdrop-blur hover:bg-[#0d2818]"
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
      </div>
    </section>
  );
}

/** Top-down doubles court, horizontal orientation (baselines left/right, net vertical). */
function HorizontalCourtLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 378 174" preserveAspectRatio="none" aria-hidden="true">
      {/* Doubles outer already from container border; singles sidelines (top/bottom) */}
      <line x1="8" y1="28" x2="370" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <line x1="8" y1="146" x2="370" y2="146" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

      {/* Service lines (parallel to net, ~27% from each baseline) */}
      <line x1="102" y1="28" x2="102" y2="146" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />
      <line x1="276" y1="28" x2="276" y2="146" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />

      {/* Center service line */}
      <line x1="102" y1="87" x2="276" y2="87" stroke="rgba(255,255,255,0.36)" strokeWidth="1.3" />

      {/* Net posts + net (vertical through middle) */}
      <rect x="185" y="8" width="8" height="8" rx="1" fill="rgba(255,255,255,0.45)" />
      <rect x="185" y="158" width="8" height="8" rx="1" fill="rgba(255,255,255,0.45)" />
      <line x1="189" y1="16" x2="189" y2="158" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" />
    </svg>
  );
}
