"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  emoji: string;
  value: number;
  suffix?: string;
  label: string;
  glow?: boolean;
}

const STATS: Stat[] = [
  { emoji: "🎾", value: 840, suffix: "+", label: "Players already waiting", glow: true },
  { emoji: "🏟", value: 124, label: "Courts being indexed" },
  { emoji: "📍", value: 12, label: "Cities to be supported" },
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedStats() {
  const [counts, setCounts] = useState(() => STATS.map(() => 0));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const duration = 2200;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(t);
      setCounts(STATS.map((s) => Math.round(s.value * eased)));
      if (t < 1) requestAnimationFrame(tick);
    };

    const delay = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => clearTimeout(delay);
  }, []);

  return (
    <section className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
      {STATS.map((stat, i) => (
        <div key={stat.label} className="relative flex flex-col items-center py-4">
          {stat.glow && (
            <div className="stat-glow absolute inset-0 -z-10 rounded-full" aria-hidden="true" />
          )}
          <span className="mb-2 text-2xl">{stat.emoji}</span>
          <span className="text-3xl font-bold text-accent sm:text-4xl">
            {counts[i]}
            {stat.suffix ?? ""}
          </span>
          <span className="mt-1 text-center text-[10px] font-medium tracking-widest text-white/80 uppercase sm:text-xs">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}
