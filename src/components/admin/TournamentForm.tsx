"use client";

import { useActionState, useMemo, useState } from "react";
import { saveTournament, type AdminFormState } from "@/app/admin/actions";
import { COUNTRIES } from "@/lib/tournaments/countries";
import { EVENT_TYPES, type TournamentRecord } from "@/lib/tournaments/types";

const inputClass = "w-full border border-border bg-input-bg px-3 py-2 text-sm";

const emptyCategory = {
  discipline: "singles",
  gender: "open",
  ageLabel: "",
  ageMin: "",
  ageMax: "",
  level: "recreational",
  rankingRequirement: "",
  entryFeeAmount: "",
  currency: "EUR",
  registrationDeadline: "",
  registrationStatus: "",
};

export default function TournamentForm({ tournament }: { tournament?: TournamentRecord }) {
  const [state, action, pending] = useActionState(saveTournament, {} as AdminFormState);
  const initial = useMemo(
    () =>
      tournament?.categories.map((category) => ({
        discipline: category.discipline,
        gender: category.gender,
        ageLabel: category.ageLabel ?? "",
        ageMin: category.ageMin?.toString() ?? "",
        ageMax: category.ageMax?.toString() ?? "",
        level: category.level,
        rankingRequirement: category.rankingRequirement ?? "",
        entryFeeAmount: category.entryFeeAmount?.toString() ?? "",
        currency: category.currency ?? "EUR",
        registrationDeadline: category.registrationDeadline ?? "",
        registrationStatus: category.registrationStatus ?? "",
      })) ?? [{ ...emptyCategory }],
    [tournament],
  );
  const [categories, setCategories] = useState(initial);

  return (
    <form action={action} className="grid max-w-3xl gap-4">
      {tournament ? <input type="hidden" name="id" value={tournament.id} /> : null}
      <input type="hidden" name="categories" value={JSON.stringify(categories)} />
      {state.error ? <p className="border border-destructive px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

      <Field label="Official name" name="name" defaultValue={tournament?.name} required />
      <Field label="Slug" name="slug" defaultValue={tournament?.slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">Country</span>
          <select className={inputClass} name="country" defaultValue={tournament?.countryCode ?? "lt"} required>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.nameEn}
              </option>
            ))}
          </select>
        </label>
        <Field label="City" name="city" defaultValue={tournament?.city} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" name="starts_on" type="date" defaultValue={tournament?.startsOn} required />
        <Field label="End date" name="ends_on" type="date" defaultValue={tournament?.endsOn} required />
      </div>
      <Field label="Registration deadline" name="registration_deadline" type="date" defaultValue={tournament?.registrationDeadline ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Registration" name="registration_status" defaultValue={tournament?.registrationStatus ?? "unknown"} options={["open", "closed", "unknown", "not_required"]} />
        <Select label="Lifecycle" name="lifecycle_status" defaultValue={tournament?.lifecycleStatus ?? "upcoming"} options={["upcoming", "registration_open", "registration_closed", "completed", "cancelled", "postponed"]} />
      </div>
      <Field label="Registration URL" name="registration_url" defaultValue={tournament?.registrationUrl ?? ""} />
      <Field label="Official URL" name="official_url" defaultValue={tournament?.officialUrl ?? ""} />
      <Field label="Source URL" name="source_url" defaultValue={tournament?.sourceUrl} required />
      <Field label="Source external id" name="source_external_id" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Surface" name="surface" defaultValue={tournament?.surface ?? "hard"} options={["clay", "hard", "grass", "carpet", "other"]} />
        <Select label="Indoor or outdoor" name="environment" defaultValue={tournament?.environment ?? "outdoor"} options={["indoor", "outdoor", "mixed"]} />
        <Select label="Legacy audience" name="audience" defaultValue={tournament?.audience ?? "recreational"} options={["recreational", "masters", "junior", "professional"]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Event type" name="event_type" defaultValue={tournament?.eventType ?? "TOURNAMENT"} options={[...EVENT_TYPES]} />
        <Select label="Format" name="event_format" defaultValue={tournament?.eventFormat ?? "MULTIPLE"} options={["SINGLES", "MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "MULTIPLE"]} />
        <Select label="Duration" name="duration_type" defaultValue={tournament?.durationType ?? "ONE_DAY"} options={["ONE_DAY", "WEEKEND", "ONGOING", "LEAGUE"]} />
        <Select label="Who can play" name="play_audience" defaultValue={tournament?.playAudience ?? "OPEN_AMATEURS"} options={["OPEN_AMATEURS", "CLUB_MEMBERS", "INVITATION_ONLY", "COMPANY", "PROFESSION_SPECIFIC", "JUNIORS"]} />
        <Select label="Public registration" name="public_registration" defaultValue={tournament?.publicRegistration ?? "UNKNOWN"} options={["OPEN", "NOT_STARTED", "CLOSED", "FULL", "INVITATION_ONLY", "UNKNOWN"]} />
        <Select label="Level" name="play_level" defaultValue={tournament?.playLevel ?? ""} options={["", "LIGHT", "MIDDLE", "ADVANCED", "NTRP", "OTHER"]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start time" name="start_time" type="time" defaultValue={tournament?.startTime ?? ""} />
        <Field label="End time" name="end_time" type="time" defaultValue={tournament?.endTime ?? ""} />
      </div>
      <Field label="Price" name="price_label" defaultValue={tournament?.priceLabel ?? ""} />
      <Field label="Original source URL" name="original_source_url" defaultValue={tournament?.originalSourceUrl ?? ""} />
      <Select label="Source kind" name="source_kind" defaultValue={tournament?.sourceKind ?? "ORGANISER_WEBSITE"} options={["ORGANISER_WEBSITE", "FACEBOOK", "INSTAGRAM", "AGGREGATOR", "MUNICIPALITY", "VENUE", "OTHER"]} />
      <Select label="Type" name="tournament_type" defaultValue={tournament?.tournamentType ?? "recreational"} options={["club", "national", "masters", "recreational", "other"]} />
      <Field label="Series" name="series_name" defaultValue={tournament?.seriesName ?? ""} />
      <Field label="Organizer" name="organizer_name" defaultValue={tournament?.organizerName ?? ""} />
      <Field label="Organizer website" name="organizer_website" defaultValue={tournament?.organizerWebsite ?? ""} />
      <Field label="Venue" name="venue_name" defaultValue={tournament?.venueName ?? ""} />
      <Field label="Venue address" name="venue_address" defaultValue={tournament?.venueAddress ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" name="latitude" defaultValue={tournament?.latitude?.toString() ?? ""} />
        <Field label="Longitude" name="longitude" defaultValue={tournament?.longitude?.toString() ?? ""} />
      </div>
      <Field label="Contact name" name="contact_name" defaultValue={tournament?.contactName ?? ""} />
      <Field label="Contact email" name="contact_email" defaultValue={tournament?.contactEmail ?? ""} />
      <Field label="Contact phone" name="contact_phone" defaultValue={tournament?.contactPhone ?? ""} />
      <Field label="Image URL" name="image_url" defaultValue={tournament?.imageUrl ?? ""} />
      <Field label="Prize note" name="prize_summary" defaultValue={tournament?.prizeSummary ?? ""} />
      <label className="grid gap-1 text-sm">
        <span className="font-semibold">Description</span>
        <textarea className={inputClass} name="description" rows={4} defaultValue={tournament?.translations[0]?.description ?? ""} />
      </label>

      <fieldset className="grid gap-3 border border-border p-4">
        <legend className="px-2 text-sm font-semibold">Categories</legend>
        {categories.map((category, index) => (
          <div key={index} className="grid gap-2 border border-border p-3 sm:grid-cols-3">
            <Mini label="Discipline" value={category.discipline} onChange={(value) => update(index, "discipline", value)} options={["singles", "doubles", "mixed_doubles"]} />
            <Mini label="Gender" value={category.gender} onChange={(value) => update(index, "gender", value)} options={["men", "women", "mixed", "open"]} />
            <Mini label="Level" value={category.level} onChange={(value) => update(index, "level", value)} options={["recreational", "club", "competitive", "national"]} />
            <label className="grid gap-1 text-xs">
              Age label
              <input className={inputClass} value={category.ageLabel} onChange={(event) => update(index, "ageLabel", event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs">
              Age min
              <input className={inputClass} value={category.ageMin} onChange={(event) => update(index, "ageMin", event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs">
              Age max
              <input className={inputClass} value={category.ageMax} onChange={(event) => update(index, "ageMax", event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs">
              Fee
              <input className={inputClass} value={category.entryFeeAmount} onChange={(event) => update(index, "entryFeeAmount", event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs">
              Currency
              <input className={inputClass} value={category.currency} onChange={(event) => update(index, "currency", event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs sm:col-span-3">
              Ranking note
              <input className={inputClass} value={category.rankingRequirement} onChange={(event) => update(index, "rankingRequirement", event.target.value)} />
            </label>
            {categories.length > 1 ? (
              <button type="button" className="text-left text-xs font-semibold text-destructive" onClick={() => setCategories((rows) => rows.filter((_, row) => row !== index))}>
                Remove category
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" className="w-fit text-sm font-semibold text-accent" onClick={() => setCategories((rows) => [...rows, { ...emptyCategory }])}>
          Add category
        </button>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={tournament?.published ?? false} />
        Published
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="verified" defaultChecked={tournament?.verificationStatus === "verified"} />
        Verified now
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-fit rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60">
        {pending ? "Saving..." : "Save tournament"}
      </button>
    </form>
  );

  function update(index: number, key: string, value: string) {
    setCategories((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <input className={inputClass} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </label>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <select className={inputClass} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Mini({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1 text-xs">
      {label}
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
