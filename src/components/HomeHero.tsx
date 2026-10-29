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
      <div className="grid overflow-hidden rounded-[32px] bg-[#0d2818] text-white lg:min-h-[420px] lg:grid-cols-[1.08fr_0.92fr]">
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

        {/* Right half IS the court, edge to edge */}
        <div className="relative min-h-[360px] overflow-hidden border-t border-white/10 bg-[#184a32] sm:min-h-[400px] lg:min-h-full lg:border-l lg:border-t-0">
          <HeroCourtLines />

          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(200,255,0,0.16),transparent_42%),radial-gradient(ellipse_at_70%_80%,rgba(0,0,0,0.28),transparent_55%),radial-gradient(ellipse_at_30%_15%,rgba(0,0,0,0.18),transparent_45%)]"
            aria-hidden="true"
          />

          <div className="absolute inset-x-5 top-5 z-20 flex items-start justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 sm:inset-x-7 sm:top-7">
            <span>{home.heroCaption}</span>
            <span className="tabular-nums text-[#c8ff00]">{home.heroScore}</span>
          </div>

          <div className="absolute left-1/2 top-[44%] z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_28px_48px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8ff00]/18 blur-3xl" aria-hidden="true" />
            <HeroRandomBall hrefs={tournamentHrefs} label={home.findTournament}>
              <TennisBallIcon size={168} priority variant="cta" />
            </HeroRandomBall>
          </div>

          <a
            href="#play-next"
            className="absolute bottom-5 right-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0d2818]/75 text-lg text-[#c8ff00] backdrop-blur hover:bg-[#0d2818] sm:bottom-6 sm:right-6"
            aria-label={home.findTournament}
          >
            ↗
          </a>
        </div>
      </div>
    </section>
  );
}

/** Top-down doubles court, vertical orientation. Proportions follow regulation layout. */
function HeroCourtLines() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 300 520"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Court surface fill already from parent bg; outer doubles boundary */}
      <rect
        x="28"
        y="28"
        width="244"
        height="464"
        rx="4"
        fill="none"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="1.6"
      />
      {/* Singles sidelines */}
      <line x1="58" y1="28" x2="58" y2="492" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />
      <line x1="242" y1="28" x2="242" y2="492" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />

      {/* Service lines: ~23% from each baseline toward center */}
      <line x1="58" y1="135" x2="242" y2="135" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />
      <line x1="58" y1="385" x2="242" y2="385" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" />

      {/* Center service lines (service box only) */}
      <line x1="150" y1="135" x2="150" y2="260" stroke="rgba(255,255,255,0.36)" strokeWidth="1.3" />
      <line x1="150" y1="260" x2="150" y2="385" stroke="rgba(255,255,255,0.36)" strokeWidth="1.3" />

      {/* Net posts + net */}
      <rect x="22" y="254" width="6" height="12" rx="1" fill="rgba(255,255,255,0.45)" />
      <rect x="272" y="254" width="6" height="12" rx="1" fill="rgba(255,255,255,0.45)" />
      <line x1="28" y1="260" x2="272" y2="260" stroke="rgba(255,255,255,0.55)" strokeWidth="2.4" />
    </svg>
  );
}
