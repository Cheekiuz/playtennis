"use client";

import { useEffect, useMemo, useState } from "react";
import TennisBallIcon from "@/components/TennisBallIcon";
import { useLocale } from "@/context/LocaleContext";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedStats() {
  const { messages: m } = useLocale();

  const stats = useMemo(
    () => [
      { emoji: null, value: 840, suffix: "+", label: m.stats.players, glow: true },
      { emoji: "🏟", value: 124, label: m.stats.courts },
      { emoji: "📍", value: 12, label: m.stats.cities },
    ],
    [m.stats],
  );

  const [counts, setCounts] = useState(() => stats.map(() => 0));

  useEffect(() => {
    const duration = 2200;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(t);
      setCounts(stats.map((s) => Math.round(s.value * eased)));
      if (t < 1) requestAnimationFrame(tick);
    };

    const delay = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => clearTimeout(delay);
  }, [stats]);

  return (
    <section className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
      {stats.map((stat, i) => (
        <div key={stat.label} className="relative flex flex-col items-center py-4">
          {stat.glow && (
            <div className="stat-glow absolute inset-0 -z-10 rounded-full" aria-hidden="true" />
          )}
          <span className="mb-2 flex h-8 items-center justify-center">
            {stat.emoji ? (
              <span className="text-2xl">{stat.emoji}</span>
            ) : (
              <TennisBallIcon size={36} />
            )}
          </span>
          <span className="text-3xl font-bold text-accent sm:text-4xl">
            {counts[i]}
            {stat.suffix ?? ""}
          </span>
          <span className="mt-1 text-center text-[10px] font-medium tracking-widest text-foreground/80 uppercase sm:text-xs">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}
