"use client";

import { useState } from "react";
import GlassDatePicker from "@/components/ui/GlassDatePicker";
import GlassSelect from "@/components/ui/GlassSelect";
import TimeRangeSlider from "@/components/ui/TimeRangeSlider";
import WatchingSuccess from "@/components/WatchingSuccess";
import { useLocale } from "@/context/LocaleContext";
import { CITIES, CLUBS, getClubLabelKey, getCourtOptionsForClub } from "@/lib/court-alerts-config";
import type { CourtAlert } from "@/lib/court-alerts-types";
import { getClientId } from "@/lib/client-id";
import {
  getTomorrowDateString,
  hourToTime,
  parseHourFromTime,
} from "@/lib/court-alerts-utils";

const TOTAL_STEPS = 5;

export interface AlertFormData {
  city: string;
  club: string;
  alert_date: string;
  startHour: number;
  endHour: number;
  court: string;
  email: string;
}

function defaultFormData(): AlertFormData {
  return {
    city: "vilnius",
    club: "seb-arena",
    alert_date: getTomorrowDateString(),
    startHour: 18,
    endHour: 20,
    court: "any",
    email: "",
  };
}

function alertToFormData(alert: CourtAlert): AlertFormData {
  return {
    city: alert.city,
    club: alert.club,
    alert_date: alert.alert_date,
    startHour: parseHourFromTime(alert.time_start),
    endHour: parseHourFromTime(alert.time_end),
    court: alert.court,
    email: alert.email ?? "",
  };
}

interface CreateAlertFormProps {
  editingAlert?: CourtAlert | null;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export default function CreateAlertForm({
  editingAlert,
  onSuccess,
  onCancelEdit,
}: CreateAlertFormProps) {
  const { messages: m } = useLocale();
  const ca = m.courtAlerts;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AlertFormData>(
    editingAlert ? alertToFormData(editingAlert) : defaultFormData(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const clubOptions = CLUBS[form.city] ?? [];

  const courtMessages = {
    courtAny: ca.form.courtAny,
    surfaces: ca.form.surfaces,
    surfaceGroups: ca.form.surfaceGroups,
    courtWithSurface: ca.form.courtWithSurface,
  };

  const courtOptions = getCourtOptionsForClub(form.club, courtMessages);

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return Boolean(form.city && form.club);
      case 2:
        return Boolean(form.alert_date);
      case 3:
        return form.endHour > form.startHour;
      case 4:
        return Boolean(form.court);
      case 5:
        return Boolean(form.email.trim());
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const clientId = getClientId();
    const payload = {
      client_id: clientId,
      city: form.city,
      club: form.club,
      alert_date: form.alert_date,
      time_start: hourToTime(form.startHour),
      time_end: hourToTime(form.endHour),
      court: form.court,
      notify_email: true,
      email: form.email.trim(),
    };

    try {
      const url = editingAlert ? `/api/court-alerts/${editingAlert.id}` : "/api/court-alerts";
      const method = editingAlert ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? ca.form.errors.generic);
        return;
      }

      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError(ca.form.errors.network);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  if (submitted) {
    return (
      <WatchingSuccess title={ca.form.successTitle} subtitle={ca.form.successSubtitle} />
    );
  }

  const stepLabels = [
    ca.form.steps.location,
    ca.form.steps.when,
    ca.form.steps.time,
    ca.form.steps.court,
    ca.form.steps.notify,
  ];

  return (
    <div
      id="create-alert"
      className="glass-card card-glow w-full overflow-visible rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {editingAlert ? ca.form.editTitle : ca.form.title}
        </h2>
        {editingAlert && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {ca.form.cancelEdit}
          </button>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-3 flex gap-1.5">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-accent" : "bg-surface"
              }`}
            />
          ))}
        </div>
        <p className="text-xs font-medium text-muted">
          {ca.form.stepLabel.replace("{current}", String(step)).replace("{total}", String(TOTAL_STEPS))}
          {" · "}
          {stepLabels[step - 1]}
        </p>
      </div>

      <div key={step} className="form-step-enter min-h-[200px] overflow-visible">
        {step === 1 && (
          <div className="space-y-4">
            <GlassSelect
              id="city"
              label={ca.form.city}
              value={form.city}
              options={CITIES.map((c) => ({ value: c.value, label: c.label }))}
              onChange={(city) => {
                const clubs = CLUBS[city] ?? [];
                setForm((prev) => ({
                  ...prev,
                  city,
                  club: clubs[0]?.value ?? prev.club,
                  court: "any",
                }));
              }}
            />
            <GlassSelect
              id="club"
              label={ca.form.club}
              value={form.club}
              options={clubOptions.map((c) => ({
                value: c.value,
                label: ca.clubs[getClubLabelKey(c.value) as keyof typeof ca.clubs]?.label ?? c.value,
              }))}
              onChange={(club) => setForm((prev) => ({ ...prev, club, court: "any" }))}
            />
            <p className="-mt-1 text-xs leading-relaxed text-muted">
              {ca.clubs[getClubLabelKey(form.club) as keyof typeof ca.clubs]?.hint}
            </p>
          </div>
        )}

        {step === 2 && (
          <GlassDatePicker
            id="date"
            label={ca.form.date}
            value={form.alert_date}
            onChange={(alert_date) => setForm((prev) => ({ ...prev, alert_date }))}
          />
        )}

        {step === 3 && (
          <TimeRangeSlider
            label={ca.form.preferredTime}
            startHour={form.startHour}
            endHour={form.endHour}
            onChange={(startHour, endHour) =>
              setForm((prev) => ({ ...prev, startHour, endHour }))
            }
          />
        )}

        {step === 4 && (
          <GlassSelect
            id="court"
            label={ca.form.court}
            value={form.court}
            options={courtOptions}
            onChange={(court) => setForm((prev) => ({ ...prev, court }))}
          />
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label htmlFor="alert-email" className="block text-sm font-medium text-foreground">
              {ca.form.emailNotification}
            </label>
            <input
              id="alert-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={ca.form.emailPlaceholder}
              className="w-full rounded-xl border border-border bg-input-bg px-4 py-3.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {ca.form.back}
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue() || loading}
          className="btn-glow btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading
            ? ca.form.loading
            : step === TOTAL_STEPS
              ? ca.form.startWatching
              : ca.form.continue}
        </button>
      </div>
    </div>
  );
}
