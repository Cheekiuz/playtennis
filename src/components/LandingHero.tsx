import type { Messages } from "@/lib/i18n";
import TennisBallIcon from "@/components/TennisBallIcon";

interface LandingHeroProps {
  messages: Messages;
}

export default function LandingHero({ messages: m }: LandingHeroProps) {
  return (
    <>
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5">
        <TennisBallIcon size={20} className="animate-pulse" priority />
        <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
          {m.hero.badge}
        </span>
      </div>

      <h1 className="text-4xl leading-tight font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {m.hero.title}
        {m.hero.titleAccent ? (
          <>
            {" "}
            <span className="text-accent">{m.hero.titleAccent}</span>
          </>
        ) : null}
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/90 sm:text-lg [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
        {m.hero.subtitle}
      </p>
    </>
  );
}
