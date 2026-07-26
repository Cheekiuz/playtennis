"use client";

import { useEffect, useState } from "react";
import AlertEmptyState from "@/components/AlertEmptyState";
import AlertWidgetCard from "@/components/AlertWidgetCard";
import CreateAlertForm from "@/components/CreateAlertForm";
import { useLocale } from "@/context/LocaleContext";
import { getClientId } from "@/lib/client-id";
import type { CourtAlert } from "@/lib/court-alerts-types";
import { triggerCourtRain } from "@/lib/court-controls";

interface ActiveAlertsPanelProps {
  onEditAlert?: (alert: CourtAlert) => void;
  onLoaded?: (count: number) => void;
}

function ActiveAlertsPanelInner({ onEditAlert, onLoaded }: ActiveAlertsPanelProps) {
  const { messages: m } = useLocale();
  const ca = m.courtAlerts;

  const [alerts, setAlerts] = useState<CourtAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      const clientId = getClientId();
      if (!clientId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/court-alerts?client_id=${encodeURIComponent(clientId)}`);
        const data = (await res.json()) as { alerts?: CourtAlert[]; error?: string };

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? ca.form.errors.generic);
          return;
        }

        const list = data.alerts ?? [];
        setAlerts(list);
        onLoaded?.(list.length);
      } catch {
        if (!cancelled) setError(ca.form.errors.network);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [ca.form.errors.generic, ca.form.errors.network, onLoaded]);

  const reloadAlerts = async () => {
    const clientId = getClientId();
    if (!clientId) return;

    try {
      const res = await fetch(`/api/court-alerts?client_id=${encodeURIComponent(clientId)}`);
      const data = (await res.json()) as { alerts?: CourtAlert[]; error?: string };
      if (res.ok) {
        const list = data.alerts ?? [];
        setAlerts(list);
        onLoaded?.(list.length);
      }
    } catch {
      // silent fail on reload
    }
  };

  const handlePause = async (alert: CourtAlert) => {
    const clientId = getClientId();
    const newStatus = alert.status === "active" ? "paused" : "active";

    try {
      const res = await fetch(`/api/court-alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, status: newStatus }),
      });

      if (res.ok) {
        await reloadAlerts();
      }
    } catch {
      // silent fail for toggle
    }
  };

  const handleDelete = async (alert: CourtAlert) => {
    if (!window.confirm(ca.active.deleteConfirm)) return;

    const clientId = getClientId();

    try {
      const res = await fetch(`/api/court-alerts/${alert.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (res.ok) {
        await reloadAlerts();
      }
    } catch {
      // silent fail
    }
  };

  return (
    <div className="glass-card card-glow w-full rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md">
      <h2 className="text-xl font-semibold text-foreground">{ca.active.title}</h2>

      {loading && <p className="mt-6 text-sm text-muted">{ca.active.loading}</p>}

      {error && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && alerts.length === 0 && <AlertEmptyState />}

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
  );
}

export default function ActiveAlertsPanel(props: ActiveAlertsPanelProps) {
  return <ActiveAlertsPanelInner {...props} />;
}

export function CourtAlertsGrid({ onRain }: { onRain?: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingAlert, setEditingAlert] = useState<CourtAlert | null>(null);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setEditingAlert(null);
    if (!triggerCourtRain()) {
      onRain?.();
    }
  };

  return (
    <section className="mt-12 grid w-full max-w-6xl gap-6 lg:grid-cols-2">
      <CreateAlertForm
        key={editingAlert?.id ?? `new-${refreshKey}`}
        editingAlert={editingAlert}
        onSuccess={handleSuccess}
        onCancelEdit={() => setEditingAlert(null)}
      />
      <ActiveAlertsPanel
        key={refreshKey}
        onEditAlert={(alert) => {
          setEditingAlert(alert);
          document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </section>
  );
}
