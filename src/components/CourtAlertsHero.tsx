"use client";

import { useLocale } from "@/context/LocaleContext";
import TennisBallIcon from "@/components/TennisBallIcon";

export default function CourtAlertsHero() {
  const { messages: m } = useLocale();
  const ca = m.courtAlerts;

  const scrollToForm = () => {
    document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5">
        <TennisBallIcon size={20} className="animate-pulse" priority />
        <span className="text-[11px] font-semibold tracking-widest text-accent uppercase">
          {ca.hero.badge}
        </span>
      </div>

      <h1 className="text-4xl leading-tight font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {ca.hero.title}
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/90 sm:text-lg [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
        {ca.hero.subtitle}
      </p>

      <button
        type="button"
        onClick={scrollToForm}
        className="btn-glow btn-primary mt-8 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
      >
        <TennisBallIcon size={20} variant="cta" />
        {ca.hero.cta}
      </button>
    </>
  );
}
