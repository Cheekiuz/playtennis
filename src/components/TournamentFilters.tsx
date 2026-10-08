"use client";

import { useEffect, useId, useState } from "react";
import { track } from "@/lib/analytics";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { regionName } from "@/lib/tournaments/countries";
import type { EventPlaces } from "@/lib/tournaments/queries";
import { EVENT_TYPES, type TournamentFilters } from "@/lib/tournaments/types";

export default function TournamentFilters({
  locale,
  messages,
  values,
  places,
  appearance = "theme",
}: {
  locale: Locale;
  messages: Messages;
  values: TournamentFilters;
  places: EventPlaces;
  appearance?: "theme" | "paper";
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const action = localePath(locale, "/tournaments");
  const d = messages.discover;
  const paper = appearance === "paper";
  const fieldClass = paper
    ? "min-h-11 w-full rounded-lg border border-[#e2e2e2] bg-white px-3 py-2 text-sm text-[#1a1c1c]"
    : "min-h-11 w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground";
  const labelClass = paper ? "grid gap-1 text-sm text-[#1a1c1c]" : "grid gap-1 text-sm text-foreground";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const advanced = advancedValues(values);
  const cityListId = useId();
  const cities = places.cities.includes(values.city ?? "") || !values.city ? places.cities : [values.city, ...places.cities];

  return (
    <form
      action={action}
      method="get"
      className="grid gap-4"
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        track("tournament_search", {
          country: String(data.get("country") ?? ""),
          when: String(data.get("when") ?? ""),
          surface: String(data.get("surface") ?? ""),
          event: String(data.get("event") ?? ""),
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={d.date}
          name="when"
          defaultValue={values.when ?? ""}
          fieldClass={fieldClass}
          labelClass={labelClass}
          options={[
            ["", d.anyDate],
            ["this-weekend", d.thisWeekend],
            ["next-weekend", d.nextWeekend],
            ["this-month", d.thisMonth],
            ["custom", d.custom],
          ]}
        />
        <label className={labelClass}>
          <span className="font-semibold">{d.city}</span>
          <input
            className={fieldClass}
            name="city"
            defaultValue={values.city ?? ""}
            placeholder={d.anyCity}
            list={cityListId}
            autoComplete="off"
          />
          <datalist id={cityListId}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </label>
        <Select
          label={d.eventType}
          name="event"
          defaultValue={values.event ?? ""}
          fieldClass={fieldClass}
          labelClass={labelClass}
          options={[["", d.anyType], ...EVENT_TYPES.map((type) => [type, d.eventTypes[type]] as [string, string])]}
        />
        <Select
          label={d.playLevel}
          name="playLevel"
          defaultValue={values.playLevel ?? ""}
          fieldClass={fieldClass}
          labelClass={labelClass}
          options={[
            ["", d.anyPlayLevel],
            ["LIGHT", d.playLevels.LIGHT],
            ["MIDDLE", d.playLevels.MIDDLE],
            ["ADVANCED", d.playLevels.ADVANCED],
            ["NTRP", d.playLevels.NTRP],
            ["OTHER", d.playLevels.OTHER],
          ]}
        />
      </div>

      {open ? null : <HiddenFields values={advanced} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold ${
            paper ? "bg-[#151d19] text-[#c1f100] hover:bg-[#506600]" : "btn-primary"
          }`}
        >
          {d.explore}
        </button>
        <button
          type="button"
          className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold ${
            paper ? "border-[#c3c8c3] bg-white text-[#1a1c1c]" : "border-border bg-card text-foreground"
          }`}
          aria-expanded={open}
          aria-controls={titleId}
          onClick={() => setOpen(true)}
        >
          {d.moreFilters}
          {advancedActive(values) ? <span className="ml-2 h-2 w-2 rounded-full bg-current" aria-hidden="true" /> : null}
        </button>
        <a href={action} className={`inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline ${paper ? "text-[#1a1c1c]" : "text-foreground"}`}>
          {d.clear}
        </a>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={messages.nav.close} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative max-h-[88vh] w-full overflow-auto rounded-t-2xl p-5 sm:max-w-xl sm:rounded-2xl ${
              paper ? "bg-[#f9f9f8] text-[#1a1c1c]" : "bg-background text-foreground"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-lg font-bold">
                {d.moreFilters}
              </h2>
              <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => setOpen(false)}>
                {messages.nav.close}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="font-semibold">{d.search}</span>
                <input className={fieldClass} name="q" defaultValue={values.q ?? ""} placeholder={d.searchPlaceholder} />
              </label>
              <Select
                label={d.registrationLabel}
                name="registration"
                defaultValue={values.registration ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyRegistration],
                  ["open", d.publicRegistration.OPEN],
                  ["soon", d.publicRegistration.NOT_STARTED],
                  ["closed", d.publicRegistration.CLOSED],
                  ["full", d.publicRegistration.FULL],
                  ["unknown", d.publicRegistration.UNKNOWN],
                ]}
              />
              <Select
                label={d.surface}
                name="surface"
                defaultValue={values.surface ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anySurface],
                  ["clay", d.surfaces.clay],
                  ["hard", d.surfaces.hard],
                  ["grass", d.surfaces.grass],
                  ["carpet", d.surfaces.carpet],
                  ["unknown", d.surfaces.unknown],
                ]}
              />
              <Select
                label={d.environment}
                name="environment"
                defaultValue={values.environment ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyEnvironment],
                  ["indoor", d.environments.indoor],
                  ["outdoor", d.environments.outdoor],
                  ["mixed", d.environments.mixed],
                ]}
              />
              <Select
                label={d.age}
                name="age"
                defaultValue={values.age ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyAge],
                  ["open", d.ages.open],
                  ["35", d.ages["35"]],
                  ["40", d.ages["40"]],
                  ["45", d.ages["45"]],
                  ["50", d.ages["50"]],
                  ["55", d.ages["55"]],
                  ["60", d.ages["60"]],
                  ["u18", d.ages.u18],
                ]}
              />
              <Select
                label={d.gender}
                name="gender"
                defaultValue={values.gender ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyGender],
                  ["men", d.genders.men],
                  ["women", d.genders.women],
                  ["mixed", d.genders.mixed],
                  ["open", d.genders.open],
                  ["boys", d.genders.boys],
                  ["girls", d.genders.girls],
                ]}
              />
              <Select
                label={d.format}
                name="format"
                defaultValue={values.format ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyFormat],
                  ["SINGLES", d.formats.SINGLES],
                  ["MEN_DOUBLES", d.formats.MEN_DOUBLES],
                  ["WOMEN_DOUBLES", d.formats.WOMEN_DOUBLES],
                  ["MIXED_DOUBLES", d.formats.MIXED_DOUBLES],
                ]}
              />
              <Select
                label={d.country}
                name="country"
                defaultValue={values.country ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={countryOptions(places, values.country, locale, d.anyCountry)}
              />
              {places.regions.length > 0 || values.region ? (
                <Select
                  label={d.region}
                  name="region"
                  defaultValue={values.region ?? ""}
                  fieldClass={fieldClass}
                  labelClass={labelClass}
                  options={regionOptions(places, values.region, d.anyRegion)}
                />
              ) : null}
              <Select label={d.from} name="from" defaultValue={values.from ?? ""} fieldClass={fieldClass} labelClass={labelClass} options={[]} date />
              <Select label={d.to} name="to" defaultValue={values.to ?? ""} fieldClass={fieldClass} labelClass={labelClass} options={[]} date />
              <Select
                label={d.category}
                name="audience"
                defaultValue={values.audience ?? ""}
                fieldClass={fieldClass}
                labelClass={labelClass}
                options={[
                  ["", d.anyCategory],
                  ["recreational", d.audiences.recreational],
                  ["masters", d.audiences.masters],
                  ["junior", d.audiences.junior],
                ]}
              />
            </div>
            <button
              type="submit"
              className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold ${
                paper ? "bg-[#151d19] text-[#c1f100]" : "btn-primary"
              }`}
            >
              {d.explore}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function HiddenFields({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
    </>
  );
}

function advancedValues(values: TournamentFilters): Record<string, string> {
  return {
    q: values.q ?? "",
    registration: values.registration ?? "",
    surface: values.surface ?? "",
    environment: values.environment ?? "",
    age: values.age ?? "",
    gender: values.gender ?? "",
    format: values.format ?? "",
    country: values.country ?? "",
    region: values.region ?? "",
    from: values.from ?? "",
    to: values.to ?? "",
    audience: values.audience ?? "",
  };
}

function advancedActive(values: TournamentFilters): boolean {
  return Object.values(advancedValues(values)).some(Boolean);
}

function Select({
  label,
  name,
  defaultValue,
  options,
  fieldClass,
  labelClass,
  date = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[][];
  fieldClass: string;
  labelClass: string;
  date?: boolean;
}) {
  return (
    <label className={labelClass}>
      <span className="font-semibold">{label}</span>
      {date ? (
        <input className={fieldClass} type="date" name={name} defaultValue={defaultValue} />
      ) : (
        <select className={fieldClass} name={name} defaultValue={defaultValue}>
          {options.map(([value, text]) => (
            <option key={value || "any"} value={value}>
              {text}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

function countryOptions(places: EventPlaces, selected: string | undefined, locale: Locale, anyLabel: string): string[][] {
  const countries = [...places.countries];
  if (selected && !countries.some((country) => country.code === selected)) {
    countries.push({ code: selected, name: regionName(selected, locale), count: 0 });
  }
  return [["", anyLabel], ...countries.map((country) => [country.code, country.name] as [string, string])];
}

function regionOptions(places: EventPlaces, selected: string | undefined, anyLabel: string): string[][] {
  const regions = [...places.regions];
  if (selected && !regions.includes(selected)) regions.push(selected);
  return [["", anyLabel], ...regions.map((region) => [region, region] as [string, string])];
}
