"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AchievementIcon, type Achievement } from "@/components/AchievementIcon";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RotatingMessage from "@/components/RotatingMessage";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import WaitlistForm from "@/components/WaitlistForm";
import type { InteractiveCourtHandle } from "@/components/InteractiveCourt";
import type { Messages } from "@/lib/i18n";

const InteractiveCourt = dynamic(() => import("@/components/InteractiveCourt"), {
  ssr: false,
  loading: () => (
    <div className="pointer-events-none fixed inset-0 z-0 bg-background" aria-hidden="true" />
  ),
});

interface LandingPageClientProps {
  messages: Messages;
  hero: ReactNode;
  stats: ReactNode;
  tip: ReactNode;
  footer: ReactNode;
}

export default function LandingPageClient({
  messages: m,
  hero,
  stats,
  tip,
  footer,
}: LandingPageClientProps) {
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyT" && e.key.toLowerCase() !== "t") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;

      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      courtRef.current?.triggerBurst();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return (
    <>
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
          {hero}
          <RotatingMessage />
        </section>

        <section id="waitlist" className="relative z-20 mt-10 flex w-full justify-center sm:mt-14">
          <WaitlistForm onSuccess={() => courtRef.current?.triggerRain()} />
        </section>

        {stats}
        {tip}
      </main>

      {footer}
    </>
  );
}
