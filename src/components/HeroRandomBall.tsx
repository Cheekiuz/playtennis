"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import HeroTournamentModal, { makeSamplePick, type HeroModalPick } from "@/components/HeroTournamentModal";
import { useLocale } from "@/context/LocaleContext";
import type { HeroPick } from "@/lib/tournaments/hero-pick";

/** Ball button: opens a popup with a random real upcoming tournament (a sample only if none exist). */
export default function HeroRandomBall({
  pool,
  label,
  children,
  className = "",
}: {
  pool: HeroPick[];
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { messages } = useLocale();
  const [pick, setPick] = useState<HeroModalPick | null>(null);
  const lastId = useRef<string | null>(null);

  const draw = useCallback(() => {
    if (pool.length === 0) {
      lastId.current = null;
      setPick(makeSamplePick(messages));
      return;
    }
    const candidates = pool.length > 1 ? pool.filter((item) => item.id !== lastId.current) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)]!;
    lastId.current = next.id;
    setPick(next);
  }, [pool, messages]);

  const close = useCallback(() => setPick(null), []);

  return (
    <>
      <button
        type="button"
        onClick={draw}
        aria-label={label}
        aria-haspopup="dialog"
        className={`relative z-10 cursor-pointer rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8ff00] active:scale-95 ${className}`.trim()}
      >
        {children}
      </button>
      {pick ? <HeroTournamentModal pick={pick} canReroll={pool.length > 1} onReroll={draw} onClose={close} /> : null}
    </>
  );
}
