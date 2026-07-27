"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreateAlertForm from "@/components/CreateAlertForm";
import LiveAvailabilityPanel from "@/components/LiveAvailabilityPanel";
import CourtAlertsHero from "@/components/CourtAlertsHero";
import HowItWorksSection from "@/components/HowItWorksSection";
import MarketingPageShell from "@/components/MarketingPageShell";
import SignInToCreateAlert from "@/components/SignInToCreateAlert";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { InteractiveCourtHandle } from "@/components/InteractiveCourt";
import { useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import type { CourtAlert } from "@/lib/court-alerts-types";
import { localePath } from "@/lib/i18n";
import { triggerCourtRain } from "@/lib/court-controls";

export default function CourtAlertsPageClient() {
  const courtRef = useRef<InteractiveCourtHandle>(null);
  const { messages: m, locale } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [loadedEditAlert, setLoadedEditAlert] = useState<CourtAlert | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const editingAlert = editId ? loadedEditAlert : null;

  const scrollToForm = () => {
    if (user) {
      document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const returnPath = `${localePath(locale, "/court-alerts")}#create-alert`;
    window.location.href = `/auth/login?next=${encodeURIComponent(returnPath)}`;
  };

  const fireRain = () => {
    courtRef.current?.triggerRain();
  };

  useEffect(() => {
    if (!user || !editId) return;

    let cancelled = false;

    async function loadAlert() {
      setEditLoading(true);
      try {
        const res = await fetch("/api/court-alerts");
        const data = (await res.json()) as { alerts?: CourtAlert[] };
        if (cancelled) return;
        const alert = data.alerts?.find((a) => a.id === editId) ?? null;
        setLoadedEditAlert(alert);
        if (alert) {
          document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
        }
      } catch {
        if (!cancelled) setLoadedEditAlert(null);
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    }

    void loadAlert();
    return () => {
      cancelled = true;
    };
  }, [user, editId]);

  const handleFormSuccess = () => {
    setLoadedEditAlert(null);
    if (typeof window !== "undefined" && window.location.search.includes("edit=")) {
      window.history.replaceState({}, "", localePath(locale, "/court-alerts"));
    }
    if (!triggerCourtRain()) {
      fireRain();
    }
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

        <section className="mt-12 flex w-full max-w-6xl justify-center">
          {authLoading || editLoading ? (
            <div
              id="create-alert"
              className="glass-card w-full max-w-2xl rounded-3xl border border-border bg-card/95 p-8 text-center backdrop-blur-md"
            >
              <p className="text-sm text-muted">{m.courtAlerts.form.loading}</p>
            </div>
          ) : user ? (
            <CreateAlertForm
              key={editingAlert?.id ?? "new"}
              editingAlert={editingAlert}
              onSuccess={handleFormSuccess}
              onCancelEdit={() => {
                setLoadedEditAlert(null);
                window.history.replaceState({}, "", localePath(locale, "/court-alerts"));
              }}
            />
          ) : (
            <SignInToCreateAlert />
          )}
        </section>

        <HowItWorksSection />
      </MarketingPageShell>
    </div>
  );
}
