"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  COURT_SURFACE_EVENT,
  setCourtSurface,
  type CourtSurface,
} from "@/lib/court-controls";
import { SURFACE_APRON } from "@/lib/court-draw";
import type { Messages } from "@/lib/i18n";

const InteractiveCourt = dynamic(() => import("@/components/InteractiveCourt"), {
  ssr: false,
});

const SURFACES: CourtSurface[] = ["clay", "hard", "grass"];

function surfaceLabel(surface: CourtSurface, messages: Messages) {
  if (surface === "clay") return messages.home.surfaceClay;
  if (surface === "hard") return messages.home.surfaceHard;
  return messages.home.surfaceGrass;
}

export default function HomeCourt({ messages }: { messages: Messages }) {
  const [surface, setSurface] = useState<CourtSurface>("clay");
  const home = messages.home;

  useEffect(() => {
    const onSurface = (event: Event) => {
      const next = (event as CustomEvent<CourtSurface>).detail;
      if (next === "clay" || next === "hard" || next === "grass") setSurface(next);
    };
    window.addEventListener(COURT_SURFACE_EVENT, onSurface);
    return () => window.removeEventListener(COURT_SURFACE_EVENT, onSurface);
  }, []);

  const choose = (next: CourtSurface) => {
    setSurface(next);
    setCourtSurface(next);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e2e2] bg-[#f3f4f3] p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#434845]">{home.surfaceFeed}</span>
          <div className="inline-flex rounded-lg border border-[#e2e2e2] bg-white p-1" role="group" aria-label={home.surfaceFeed}>
            {SURFACES.map((key) => {
              const active = surface === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(key)}
                  className={`flex min-h-11 items-center gap-2 rounded px-3.5 text-xs font-bold uppercase tracking-[0.06em] ${active ? "text-white" : "text-[#434845] hover:text-[#1a1c1c]"}`}
                  style={active ? { background: SURFACE_APRON[key] } : undefined}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: active ? "rgba(255,255,255,0.85)" : SURFACE_APRON[key] }}
                  />
                  {surfaceLabel(key, messages)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#e2e2e2] transition-colors duration-700"
        style={{ background: SURFACE_APRON[surface] }}
      >
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 text-white/90 sm:px-8 sm:pt-6">
          <div className="rounded-md border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
            {surfaceLabel(surface, messages)}
          </div>
        </div>
        <div className="relative mx-4 aspect-[4/3] min-h-[280px] sm:mx-8 sm:aspect-[2.2/1] sm:min-h-[340px]">
          <InteractiveCourt mode="panel" />
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-20 mix-blend-overlay"
            style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
        </div>
      </div>
      <p className="text-xs text-[#434845]">
        <span className="sr-only">{home.surfaceFeed}. </span>
        {home.pressT}
        <span aria-hidden="true"> · </span>
        {home.doubleClick}
      </p>
    </div>
  );
}
