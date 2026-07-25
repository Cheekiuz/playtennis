"use client";

import { useRef, useState } from "react";
import { AchievementIcon, type Achievement } from "@/components/AchievementIcon";
import AnimatedStats from "@/components/AnimatedStats";
import InteractiveCourt, { type InteractiveCourtHandle } from "@/components/InteractiveCourt";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RotatingMessage from "@/components/RotatingMessage";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import WaitlistForm from "@/components/WaitlistForm";
import { useLocale } from "@/context/LocaleContext";

export default function LandingPage() {
  const { messages: m } = useLocale();
  const courtRef = useRef<InteractiveCourtHandle>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next === 5) {
      setAchievement(m.achievements[Math.floor(Math.random() * m.achievements.length)]);
      courtRef.current?.triggerBurst();
      setTimeout(() => setAchievement(null), 4000);
      setLogoClicks(0);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <InteractiveCourt ref={courtRef} />

      {achievement && (
        <div className="achievement-toast pointer-events-none fixed top-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-card px-6 py-3 text-sm font-medium text-accent shadow-lg backdrop-blur-md">
          <AchievementIcon icon={achievement.icon} size={18} />
          {achievement.text}
        </div>
      )}

      <header className="pointer-events-auto relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <TennisBallIcon size={22} priority />
          PlayTennis.lt
        </button>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <a
            href="#waitlist"
            className="btn-glow btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <TennisBallIcon size={20} variant="cta" />
            {m.header.joinWaitlist}
          </a>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pb-8">
        <section className="flex max-w-3xl flex-col items-center pt-8 text-center sm:pt-12">
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

          <RotatingMessage />
        </section>

        <section id="waitlist" className="relative z-20 mt-10 flex w-full justify-center sm:mt-14">
          <WaitlistForm onSuccess={() => courtRef.current?.triggerRain()} />
        </section>

        <AnimatedStats />

        <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">⌨</span>
          <span className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
            {m.tip.press}{" "}
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-foreground">
              T
            </kbd>{" "}
            {m.tip.ballStorm}{" "}
            <TennisBallIcon size={14} />
            · {m.tip.clayMode}
          </span>
        </div>
      </main>

      <footer className="pointer-events-auto relative z-10 mt-16 border-t border-border sm:mt-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <TennisBallIcon size={16} />
            PlayTennis.lt
          </span>
          <p className="text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
            {m.footer.madeWith}
          </p>
        </div>
      </footer>
    </div>
  );
}
