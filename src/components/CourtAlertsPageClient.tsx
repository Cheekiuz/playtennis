"use client";

import { useRef } from "react";
import LiveAvailabilityPanel from "@/components/LiveAvailabilityPanel";
import { CourtAlertsGrid } from "@/components/ActiveAlertsPanel";
import CourtAlertsHero from "@/components/CourtAlertsHero";
import HowItWorksSection from "@/components/HowItWorksSection";
import MarketingPageShell from "@/components/MarketingPageShell";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { InteractiveCourtHandle } from "@/components/InteractiveCourt";
import { useLocale } from "@/context/LocaleContext";
import { localePath } from "@/lib/i18n";

export default function CourtAlertsPageClient() {
  const courtRef = useRef<InteractiveCourtHandle>(null);
  const { messages: m, locale } = useLocale();

  const scrollToForm = () => {
    document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
  };

  const fireRain = () => {
    courtRef.current?.triggerRain();
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <MarketingPageShell
        courtRef={courtRef}
        showAuth
        headerActions={
          <>
            <a
              href={localePath(locale, "/")}
              className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline"
            >
              {m.header.home}
            </a>
            <button
              type="button"
              onClick={scrollToForm}
              className="btn-glow btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <TennisBallIcon size={20} variant="cta" />
              {m.courtAlerts.hero.cta}
            </button>
          </>
        }
      >
        <section className="flex max-w-3xl flex-col items-center pt-8 text-center sm:pt-12">
          <CourtAlertsHero />
        </section>

        <LiveAvailabilityPanel />

        <CourtAlertsGrid onRain={fireRain} />

        <HowItWorksSection />
      </MarketingPageShell>
    </div>
  );
}
