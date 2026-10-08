"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n";
import { EVENT_TYPES } from "@/lib/tournaments/types";

export default function SubmitEventForm({ messages }: { messages: Messages }) {
  const s = messages.submit;
  const d = messages.discover;
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (status === "done") {
    return (
      <div className="grid gap-3">
        <h2 className="text-2xl font-bold">{s.successTitle}</h2>
        <p className="text-base leading-7 text-foreground/80">{s.successBody}</p>
        <button type="button" className="w-fit text-sm font-semibold text-accent underline-offset-2 hover:underline" onClick={() => setStatus("idle")}>
          {s.another}
        </button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = Object.fromEntries(data.entries());
        setStatus("sending");
        setError("");
        try {
          const response = await fetch("/api/events/submit", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = (await response.json()) as { error?: string };
          if (!response.ok) {
            setStatus("error");
            setError(body.error === "email" ? s.errors.email : body.error === "url" ? s.errors.url : body.error === "required" ? s.errors.required : s.errors.generic);
            return;
          }
          setStatus("done");
          event.currentTarget.reset();
        } catch {
          setStatus("error");
          setError(s.errors.generic);
        }
      }}
    >
      <div className="pointer-events-none fixed top-0 left-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label={s.name} name="eventName" required />
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">{s.type}</span>
        <select name="eventType" required className={fieldClass} defaultValue="TOURNAMENT">
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {d.eventTypes[type]}
            </option>
          ))}
        </select>
      </label>
      <Field label={s.organiser} name="organiser" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={s.date} name="startsOn" type="date" required />
        <Field label={s.endDate} name="endsOn" type="date" />
      </div>
      <Field label={s.location} name="location" />
      <Field label={s.city} name="city" required />
      <Field label={s.officialUrl} name="officialUrl" type="url" required placeholder="https://" />
      <Field label={s.registrationUrl} name="registrationUrl" type="url" placeholder="https://" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={s.surface} name="surface" placeholder={s.notSure} options={[
          ["clay", d.surfaces.clay],
          ["hard", d.surfaces.hard],
          ["grass", d.surfaces.grass],
          ["carpet", d.surfaces.carpet],
          ["other", d.surfaces.other],
        ]} />
        <Select label={s.environment} name="environment" placeholder={s.notSure} options={[
          ["indoor", d.environments.indoor],
          ["outdoor", d.environments.outdoor],
          ["mixed", d.environments.mixed],
        ]} />
      </div>
      <Select label={s.level} name="playLevel" placeholder={s.notSure} options={[
        ["LIGHT", d.playLevels.LIGHT],
        ["MIDDLE", d.playLevels.MIDDLE],
        ["ADVANCED", d.playLevels.ADVANCED],
        ["NTRP", d.playLevels.NTRP],
        ["OTHER", d.playLevels.OTHER],
      ]} />
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">{s.notes}</span>
        <textarea name="notes" rows={4} className={fieldClass} />
      </label>
      <Field label={s.yourName} name="submitterName" required autoComplete="name" />
      <Field label={s.email} name="submitterEmail" type="email" required autoComplete="email" />
      <p className="text-sm text-foreground/70">{s.note}</p>
      {error ? (
        <p className="text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={status === "sending"} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {status === "sending" ? s.sending : s.send}
      </button>
    </form>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-base text-foreground";

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <input className={fieldClass} name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  options: [string, string][];
  placeholder: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <select name={name} className={fieldClass} defaultValue="">
        <option value="">{placeholder}</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
