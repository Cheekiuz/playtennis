import HeroIllustration from "@/components/HeroIllustration";
import type { Messages } from "@/lib/i18n";
import type { HeroPick } from "@/lib/tournaments/hero-pick";

export default function HomeHero({
  messages,
  heroPool = [],
}: {
  messages: Messages;
  heroPool?: HeroPick[];
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

        <HeroIllustration
          pool={heroPool}
          label={home.findTournament}
          caption={home.heroCaption}
          score={home.heroScore}
          hint={home.heroVisualHint}
          hintSecondary={home.heroVisualHintSecondary}
        />
      </div>
    </section>
  );
}

