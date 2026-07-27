"use client";

import { useEffect, useState } from "react";
import AlertEmptyState from "@/components/AlertEmptyState";
import AlertWidgetCard from "@/components/AlertWidgetCard";
import { useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { getClientId } from "@/lib/client-id";
import type { CourtAlert } from "@/lib/court-alerts-types";
import { localePath } from "@/lib/i18n";

interface DashboardAlertsPanelProps {
  onEditAlert?: (alert: CourtAlert) => void;
}

export default function DashboardAlertsPanel({ onEditAlert }: DashboardAlertsPanelProps) {
  const { messages: m, locale } = useLocale();
  const { user } = useAuth();
  const ca = m.courtAlerts;
  const dash = m.dashboard;

  const [alerts, setAlerts] = useState<CourtAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    let cancelled = false;

    async function init() {
      const anonId = getClientId();
      if (anonId && anonId !== userId) {
        try {
          await fetch("/api/auth/migrate-alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_client_id: anonId }),
          });
          localStorage.setItem("playtennis_client_id", userId);
        } catch {
          // migration is best-effort
        }
      }

      try {
        const res = await fetch("/api/court-alerts");
        const data = (await res.json()) as { alerts?: CourtAlert[]; error?: string };
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? ca.form.errors.generic);
          return;
        }

        setAlerts(data.alerts ?? []);
        setError(null);
      } catch {
        if (!cancelled) setError(ca.form.errors.network);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [user, ca.form.errors.generic, ca.form.errors.network]);

  const reloadAlerts = async () => {
    try {
      const res = await fetch("/api/court-alerts");
      const data = (await res.json()) as { alerts?: CourtAlert[]; error?: string };
      if (res.ok) setAlerts(data.alerts ?? []);
    } catch {
      // silent
    }
  };

  const handlePause = async (alert: CourtAlert) => {
    const newStatus = alert.status === "active" ? "paused" : "active";

    try {
      const res = await fetch(`/api/court-alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await reloadAlerts();
    } catch {
      // silent
    }
  };

  const handleDelete = async (alert: CourtAlert) => {
    if (!window.confirm(ca.active.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/court-alerts/${alert.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await reloadAlerts();
        setNotice({ type: "success", message: ca.active.deleteSuccess });
      } else {
        setNotice({ type: "error", message: ca.active.deleteError });
      }
    } catch {
      setNotice({ type: "error", message: ca.active.deleteError });
    }
  };

  return (
    <>
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`achievement-toast pointer-events-none fixed top-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium shadow-lg backdrop-blur-md ${
            notice.type === "success"
              ? "border-accent/40 bg-card text-accent"
              : "border-destructive/40 bg-card text-destructive"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="glass-card card-glow w-full rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md">
      <h2 className="text-xl font-semibold text-foreground">{dash.alertsTitle}</h2>
      <p className="mt-1 text-sm text-muted">{dash.alertsSubtitle}</p>

      {loading && <p className="mt-6 text-sm text-muted">{ca.active.loading}</p>}
      {error && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="mt-6">
          <AlertEmptyState
            onCreateClick={() => {
              window.location.href = localePath(locale, "/court-alerts");
            }}
          />
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="mt-6 space-y-4">
          {alerts.map((alert) => (
            <AlertWidgetCard
              key={alert.id}
              alert={alert}
              onEdit={(a) => onEditAlert?.(a)}
              onPause={handlePause}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}
