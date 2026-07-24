"use client";

import { useRef, useState } from "react";
import AnimatedStats from "@/components/AnimatedStats";
import InteractiveCourt, { type InteractiveCourtHandle } from "@/components/InteractiveCourt";
import RotatingMessage from "@/components/RotatingMessage";
import WaitlistForm from "@/components/WaitlistForm";

const ACHIEVEMENTS = [
  "🏆 Net Navigator — You found the secret serve!",
  "🎾 Ball Hog — Certified court explorer.",
  "👑 Rally Royalty — The backboard bows to you.",
];

export default function LandingPage() {
  const courtRef = useRef<InteractiveCourtHandle>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next === 5) {
      setAchievement(ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)]);
      courtRef.current?.triggerBurst();
      setTimeout(() => setAchievement(null), 4000);
      setLogoClicks(0);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <InteractiveCourt ref={courtRef} />

      {achievement && (
        <div className="achievement-toast pointer-events-none fixed top-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-accent/40 bg-slate-900/90 px-6 py-3 text-sm font-medium text-accent shadow-lg backdrop-blur-md">
          {achievement}
        </div>
      )}

      <header className="pointer-events-auto relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <button
          type="button"
          onClick={handleLogoClick}
          className="text-lg font-bold tracking-tight text-white transition-transform hover:scale-105 active:scale-95"
        >
          PlayTennis.lt
        </button>
        <a
          href="#waitlist"
          className="btn-glow rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-[#d4ff33] active:scale-95"
        >
          Join Waitlist
        </a>
      </header>

      <main className="pointer-events-none relative z-10 flex flex-col items-center px-6 pb-8">
        <section className="flex max-w-3xl flex-col items-center pt-8 text-center sm:pt-12">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
              Launching Q4 2026
            </span>
          </div>

          <h1 className="text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Something exciting is coming to{" "}
            <span className="text-accent">Lithuanian tennis.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            A smarter way to find tennis partners, organize matches, track results, and discover
            courts—all in one place.
          </p>

          <RotatingMessage />
        </section>

        <section id="waitlist" className="pointer-events-auto mt-10 flex w-full justify-center sm:mt-14">
          <WaitlistForm onSuccess={() => courtRef.current?.triggerRain()} />
        </section>

        <AnimatedStats />

        <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-xs text-slate-400">⌨</span>
          <span className="font-mono text-xs text-slate-400">
            Press{" "}
            <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
              T
            </kbd>{" "}
            for a ball storm · Double-click the court for Clay Mode
          </span>
        </div>
      </main>

      <footer className="pointer-events-auto relative z-10 mt-16 border-t border-white/10 sm:mt-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="text-sm font-bold text-white">PlayTennis.lt</span>
          <div className="flex items-center gap-6">
            <a
              href="mailto:hello@playtennis.lt"
              className="text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              Privacy Policy
            </a>
          </div>
          <p className="text-xs text-slate-500">Made with ❤️ for tennis players.</p>
        </div>
      </footer>
    </div>
  );
}
