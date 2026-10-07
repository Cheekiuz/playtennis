"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/tournaments/countries";
import type { TournamentFilters } from "@/lib/tournaments/types";

const fieldClass =
  "w-full border border-border bg-input-bg px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function TournamentFilters({
  locale,
  messages,
  values,
  showSearch = true,
  allowMore = true,
}: {
  locale: Locale;
  messages: Messages;
  values: TournamentFilters;
  showSearch?: boolean;
  allowMore?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = localePath(locale, "/tournaments");
  const d = messages.discover;

  return (
    <form
      action={action}
      method="get"
      className="grid gap-3"
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        track("tournament_search", {
          country: String(data.get("country") ?? ""),
          when: String(data.get("when") ?? ""),
          surface: String(data.get("surface") ?? ""),
          audience: String(data.get("audience") ?? ""),
        });
      }}
    >
      {showSearch ? (
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{d.search}</span>
          <input className={fieldClass} name="q" defaultValue={values.q ?? ""} placeholder={d.searchPlaceholder} />
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label={d.country} name="country" defaultValue={values.country ?? ""} options={countryOptions(locale, d.anyCountry)} />
        <Select
          label={d.date}
          name="when"
          defaultValue={values.when ?? ""}
          options={[
            ["", d.anyDate],
            ["today", d.today],
            ["this-week", d.thisWeek],
            ["this-weekend", d.thisWeekend],
            ["next-weekend", d.nextWeekend],
            ["next-month", d.nextMonth],
            ["custom", d.custom],
          ]}
        />
        <Select
          label={d.category}
          name="audience"
          defaultValue={values.audience ?? ""}
          options={[
            ["", d.anyCategory],
            ["recreational", d.audiences.recreational],
            ["masters", d.audiences.masters],
            ["junior", d.audiences.junior],
          ]}
        />
        <Select
          label={d.surface}
          name="surface"
          defaultValue={values.surface ?? ""}
          options={[
            ["", d.anySurface],
            ["clay", d.surfaces.clay],
            ["hard", d.surfaces.hard],
            ["grass", d.surfaces.grass],
            ["carpet", d.surfaces.carpet],
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary btn-glow rounded-full px-5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {showSearch ? d.apply : d.explore}
        </button>
        {allowMore ? (
        <button
          type="button"
          className="text-sm font-semibold text-foreground/80 underline-offset-2 hover:underline sm:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? d.hideFilters : d.moreFilters}
        </button>
        ) : null}
      </div>

      {allowMore ? (
      <div className={`${open ? "fixed inset-x-0 bottom-0 z-40 grid max-h-[70vh] overflow-auto" : "hidden"} gap-3 border border-border bg-card p-4 sm:static sm:z-auto sm:grid sm:max-h-none`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold">{d.city}</span>
            <input className={fieldClass} name="city" defaultValue={values.city ?? ""} />
          </label>
          <Select label={d.from} name="from" defaultValue={values.from ?? ""} options={[]} date />
          <Select label={d.to} name="to" defaultValue={values.to ?? ""} options={[]} date />
          <Select
            label={d.environment}
            name="environment"
            defaultValue={values.environment ?? ""}
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
            options={[
              ["", d.anyGender],
              ["men", d.genders.men],
              ["women", d.genders.women],
              ["mixed", d.genders.mixed],
              ["open", d.genders.open],
            ]}
          />
          <Select
            label={d.discipline}
            name="discipline"
            defaultValue={values.discipline ?? ""}
            options={[
              ["", d.anyDiscipline],
              ["singles", d.disciplines.singles],
              ["doubles", d.disciplines.doubles],
              ["mixed_doubles", d.disciplines.mixed_doubles],
            ]}
          />
          <Select
            label={d.level}
            name="level"
            defaultValue={values.level ?? ""}
            options={[
              ["", d.anyLevel],
              ["recreational", d.levels.recreational],
              ["club", d.levels.club],
              ["competitive", d.levels.competitive],
              ["national", d.levels.national],
            ]}
          />
          <Select
            label={d.registrationFilter}
            name="registration"
            defaultValue={values.registration ?? ""}
            options={[
              ["", d.anyRegistration],
              ["open", d.registration.open],
              ["closed", d.registration.closed],
            ]}
          />
        </div>
        <a href={action} className="text-sm font-semibold text-foreground/80 underline-offset-2 hover:underline">
          {d.clear}
        </a>
      </div>
      ) : null}
    </form>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
  date = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[][];
  date?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
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

function countryOptions(locale: Locale, anyLabel: string): string[][] {
  return [
    ["", anyLabel],
    ...COUNTRIES.map((country) => [country.code, locale === "lt" ? country.nameLt : country.nameEn] as [string, string]),
  ];
}
