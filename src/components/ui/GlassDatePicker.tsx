"use client";

import { useMemo, useState } from "react";

interface GlassDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function GlassDatePicker({ id, label, value, onChange }: GlassDatePickerProps) {
  const selected = parseDate(value);
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(selected ?? today);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [viewDate]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div
        id={id}
        className="rounded-xl border border-border bg-input-bg p-4"
        role="group"
        aria-label={label}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-foreground/80 transition-colors hover:bg-surface-hover"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-foreground/80 transition-colors hover:bg-surface-hover"
          >
            ›
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) {
              return <span key={`empty-${i}`} />;
            }

            const disabled = day < today;
            const active = selected ? isSameDay(day, selected) : false;

            return (
              <button
                key={toDateString(day)}
                type="button"
                disabled={disabled}
                onClick={() => onChange(toDateString(day))}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent font-semibold text-background"
                    : disabled
                      ? "cursor-not-allowed text-muted/40"
                      : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
