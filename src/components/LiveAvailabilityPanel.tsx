"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GlassDatePicker from "@/components/ui/GlassDatePicker";
import GlassSelect from "@/components/ui/GlassSelect";
import { useLocale } from "@/context/LocaleContext";
import { CLUBS, getClubLabelKey, getCourtsForClub } from "@/lib/court-alerts-config";
import type { CourtSlot, CourtSlotStatus } from "@/lib/providers/types";

interface AvailabilityResponse {
  slots: CourtSlot[];
  fetchedAt: string;
  source: "live" | "cache" | "stale";
  provider: string;
  demo?: boolean;
  error?: string;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function slotKey(courtId: string, start: string): string {
  return `${courtId}:${start}`;
}

const STATUS_CLASS: Record<CourtSlotStatus, string> = {
  available: "bg-accent/25 text-accent border-accent/30",
  booked: "bg-surface text-muted border-border",
  for_sale: "bg-amber-500/20 text-amber-200 border-amber-500/30",
};

export default function LiveAvailabilityPanel() {
  const { messages: m } = useLocale();
  const la = m.courtAlerts.liveAvailability;

  const [club, setClub] = useState("seb-arena");
  const [date, setDate] = useState(todayString());
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedSeconds, setUpdatedSeconds] = useState(0);

  const clubOptions = CLUBS.vilnius.map((c) => ({
    value: c.value,
    label: m.courtAlerts.clubs[getClubLabelKey(c.value) as keyof typeof m.courtAlerts.clubs]?.label ?? c.value,
  }));

  const fetchAvailability = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (options?.showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch(
          `/api/court-availability?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`,
        );
        const json = (await res.json()) as AvailabilityResponse & { error?: string };
        if (!res.ok) {
          setError(json.error ?? la.error);
          setData(null);
          return;
        }
        setData(json);
        setError(null);
      } catch {
        setError(la.networkError);
        setData(null);
      } finally {
        if (options?.showLoading) {
          setLoading(false);
        }
      }
    },
    [club, date, la.error, la.networkError],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const res = await fetch(
          `/api/court-availability?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`,
        );
        const json = (await res.json()) as AvailabilityResponse & { error?: string };
        if (cancelled) return;

        if (!res.ok) {
          setError(json.error ?? la.error);
          setData(null);
          return;
        }

        setData(json);
        setError(null);
      } catch {
        if (!cancelled) {
          setError(la.networkError);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [club, date, la.error, la.networkError]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchAvailability();
    };
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void fetchAvailability();
    }, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchAvailability]);

  useEffect(() => {
    if (!data?.fetchedAt) return;

    const fetchedAt = data.fetchedAt;
    const tick = () => {
      setUpdatedSeconds(
        Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000)),
      );
    };

    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [data?.fetchedAt]);

  const handleClubChange = (value: string) => {
    setClub(value);
    setLoading(true);
    setData(null);
    setError(null);
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setLoading(true);
    setData(null);
    setError(null);
  };

  const courts = useMemo(() => getCourtsForClub(club).map((c) => c.id), [club]);

  const timeColumns = useMemo(() => {
    const slotList = data?.slots ?? [];
    if (!slotList.length) return [];
    return [...new Set(slotList.map((s) => s.start))].sort();
  }, [data]);

  const slotMap = useMemo(() => {
    const map = new Map<string, CourtSlotStatus>();
    for (const slot of data?.slots ?? []) {
      map.set(slotKey(slot.courtId, slot.start), slot.status);
    }
    return map;
  }, [data]);

  const updatedLabel = data?.fetchedAt
    ? la.updatedAgo.replace("{seconds}", String(updatedSeconds))
    : "";

  const sourceLabel =
    data?.source === "stale"
      ? la.staleData
      : data?.demo
        ? la.demoBanner
        : data?.source === "cache"
          ? la.cachedData
          : la.liveData;

  return (
    <section className="mt-12 w-full max-w-6xl">
      <div className="glass-card card-glow overflow-visible rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{la.title}</h2>
            <p className="mt-1 text-sm text-muted">{la.subtitle}</p>
          </div>
          <a
            href="https://book.sebarena.lt/#/rezervuoti/tenisas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            {la.bookLink}
          </a>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <GlassSelect
            id="live-club"
            label={m.courtAlerts.form.club}
            value={club}
            options={clubOptions}
            onChange={handleClubChange}
          />
          <GlassDatePicker id="live-date" label={m.courtAlerts.form.date} value={date} onChange={handleDateChange} />
        </div>

        {data && (
          <p className="mb-4 text-xs text-muted">
            {updatedLabel}
            {" · "}
            {sourceLabel}
          </p>
        )}

        {loading && <p className="text-sm text-muted">{la.loading}</p>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && data && timeColumns.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="sticky left-0 z-10 bg-card/95 px-3 py-2 text-left font-medium text-muted">
                    {la.courtColumn}
                  </th>
                  {timeColumns.map((t) => (
                    <th key={t} className="px-1 py-2 text-center font-medium text-muted whitespace-nowrap">
                      {formatTime(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((courtId) => (
                  <tr key={courtId} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 bg-card/95 px-3 py-2 font-medium text-foreground">
                      {courtId}
                    </td>
                    {timeColumns.map((t) => {
                      const status = slotMap.get(slotKey(courtId, t)) ?? "booked";
                      return (
                        <td key={t} className="p-0.5">
                          <div
                            className={`h-7 min-w-[2rem] rounded border ${STATUS_CLASS[status]}`}
                            title={la.statusLabels[status]}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && data && timeColumns.length === 0 && (
          <p className="text-sm text-muted">{la.noSlots}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
          {(Object.keys(STATUS_CLASS) as CourtSlotStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded border ${STATUS_CLASS[status]}`} />
              {la.statusLabels[status]}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void fetchAvailability({ showLoading: true })}
          disabled={loading}
          className="mt-6 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          {la.refresh}
        </button>
      </div>
    </section>
  );
}
