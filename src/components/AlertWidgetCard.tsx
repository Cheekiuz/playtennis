"use client";

import { useLocale } from "@/context/LocaleContext";
import { getClubLabel, getCourtLabel } from "@/lib/court-alerts-config";
import { formatDateForDisplay, formatTimeForDisplay } from "@/lib/court-alerts-validation";
import type { CourtAlert } from "@/lib/court-alerts-types";

interface AlertWidgetCardProps {
  alert: CourtAlert;
  onEdit: (alert: CourtAlert) => void;
  onPause: (alert: CourtAlert) => void;
  onDelete: (alert: CourtAlert) => void;
}

export default function AlertWidgetCard({ alert, onEdit, onPause, onDelete }: AlertWidgetCardProps) {
  const { messages: m, locale } = useLocale();
  const ca = m.courtAlerts;

  const isActive = alert.status === "active";
  const weekday = formatDateForDisplay(alert.alert_date, locale);
  const timeRange = `${formatTimeForDisplay(alert.time_start)}–${formatTimeForDisplay(alert.time_end)}`;
  const courtLabel = getCourtLabel(
    alert.court,
    alert.club,
    ca.form.courtAny,
    (n) => ca.form.courtNumber.replace("{n}", n),
  );
  const clubLabel = getClubLabel(alert.city, alert.club);

  return (
    <div className="glass-card rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isActive && <span className="alert-active-glow h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isActive
                ? "bg-accent/15 text-accent"
                : "bg-surface text-muted"
            }`}
          >
            {isActive ? ca.active.watching : ca.active.paused}
          </span>
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold text-foreground">{clubLabel}</h3>
      <p className="mt-1 text-sm text-muted">{weekday}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground/90">{timeRange}</p>
      <p className="mt-0.5 text-sm text-muted">{courtLabel}</p>

      <p className="mt-3 text-xs text-muted/80">
        {ca.active.statusLabel}:{" "}
        <span className="text-foreground/70">{ca.active.waitingForAvailability}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEdit(alert)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {ca.active.edit}
        </button>
        <button
          type="button"
          onClick={() => onPause(alert)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {isActive ? ca.active.pause : ca.active.resume}
        </button>
        <button
          type="button"
          onClick={() => onDelete(alert)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          {ca.active.delete}
        </button>
      </div>
    </div>
  );
}
