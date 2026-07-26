"use client";

import { useRef } from "react";

interface TimeRangeSliderProps {
  label: string;
  startHour: number;
  endHour: number;
  minHour?: number;
  maxHour?: number;
  onChange: (startHour: number, endHour: number) => void;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function TimeRangeSlider({
  label,
  startHour,
  endHour,
  minHour = 6,
  maxHour = 23,
  onChange,
}: TimeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const range = maxHour - minHour;
  const startPercent = ((startHour - minHour) / range) * 100;
  const endPercent = ((endHour - minHour) / range) * 100;

  const handleStartChange = (value: number) => {
    const next = Math.min(value, endHour - 1);
    onChange(next, endHour);
  };

  const handleEndChange = (value: number) => {
    const next = Math.max(value, startHour + 1);
    onChange(startHour, next);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          {formatHour(startHour)} – {formatHour(endHour)}
        </span>
      </div>

      <div ref={trackRef} className="relative h-10">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent/60"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />
        <input
          type="range"
          min={minHour}
          max={maxHour}
          value={startHour}
          onChange={(e) => handleStartChange(Number(e.target.value))}
          className="time-range-thumb absolute inset-0 z-10 w-full appearance-none bg-transparent"
          aria-label={`Start time ${formatHour(startHour)}`}
        />
        <input
          type="range"
          min={minHour}
          max={maxHour}
          value={endHour}
          onChange={(e) => handleEndChange(Number(e.target.value))}
          className="time-range-thumb absolute inset-0 z-20 w-full appearance-none bg-transparent"
          aria-label={`End time ${formatHour(endHour)}`}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{formatHour(minHour)}</span>
        <span>{formatHour(maxHour)}</span>
      </div>
    </div>
  );
}
