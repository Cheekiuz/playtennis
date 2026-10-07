"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, slugify } from "@/lib/tournaments/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AUDIENCES, DISCIPLINES, ENVIRONMENTS, GENDERS, LEVELS, LIFECYCLE, REGISTRATION, SURFACES, TOURNAMENT_TYPES } from "@/lib/tournaments/types";

export type AdminFormState = { error?: string };

type CategoryInput = {
  discipline?: string;
  gender?: string;
  ageLabel?: string;
  ageMin?: string;
  ageMax?: string;
  level?: string;
  rankingRequirement?: string;
  entryFeeAmount?: string;
  currency?: string;
  registrationDeadline?: string;
  registrationStatus?: string;
};

export async function saveTournament(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const name = text(formData, "name");
  const city = text(formData, "city");
  const country = text(formData, "country").toLowerCase();
  const startsOn = text(formData, "starts_on");
  const endsOn = text(formData, "ends_on");
  const sourceUrl = text(formData, "source_url");

  if (!name || !city || !/^[a-z]{2}$/.test(country) || !startsOn || !endsOn || !sourceUrl) {
    return { error: "Name, city, country, dates, and source URL are required." };
  }
  if (endsOn < startsOn) return { error: "The end date is before the start date." };

  let categories: CategoryInput[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("categories") ?? "[]"));
    categories = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { error: "Categories could not be read." };
  }
  if (categories.length === 0) return { error: "Add at least one category." };

  try {
    const supabase = createServerSupabaseClient();
    const id = text(formData, "id");
    const now = new Date().toISOString();

    const { data: source } = await supabase
      .from("sources")
      .select("id")
      .eq("id", "00000000-0000-4000-8000-000000000001")
      .maybeSingle();

    let sourceId = source?.id as string | undefined;
    if (!sourceId) {
      const { data: created, error } = await supabase
        .from("sources")
        .insert({ kind: "manual", name: text(formData, "source_name") || "Manual entry", ingestion: "manual", url: sourceUrl })
        .select("id")
        .single();
      if (error || !created) return { error: error?.message ?? "Could not save the source." };
      sourceId = created.id as string;
    }

    let organizerId: string | null = null;
    const organizerName = text(formData, "organizer_name");
    if (organizerName) {
      const { data: organizer, error } = await supabase
        .from("organizers")
        .insert({ name: organizerName, website: text(formData, "organizer_website") || null, country_code: country })
        .select("id")
        .single();
      if (error || !organizer) return { error: error?.message ?? "Could not save the organizer." };
      organizerId = organizer.id as string;
    }

    let venueId: string | null = null;
    const venueName = text(formData, "venue_name");
    if (venueName) {
      const { data: venue, error } = await supabase
        .from("venues")
        .insert({
          name: venueName,
          address: text(formData, "venue_address") || null,
          city,
          country_code: country,
          latitude: numberOrNull(text(formData, "latitude")),
          longitude: numberOrNull(text(formData, "longitude")),
        })
        .select("id")
        .single();
      if (error || !venue) return { error: error?.message ?? "Could not save the venue." };
      venueId = venue.id as string;
    }

    const slug = await uniqueSlug(supabase, text(formData, "slug") || slugify(name), id);
    const row = {
      slug,
      name,
      organizer_id: organizerId,
      series_name: text(formData, "series_name") || null,
      tournament_type: oneOf(text(formData, "tournament_type"), TOURNAMENT_TYPES, "recreational"),
      audience: oneOf(text(formData, "audience"), AUDIENCES, "recreational"),
      country_code: country,
      city,
      venue_id: venueId,
      starts_on: startsOn,
      ends_on: endsOn,
      timezone: text(formData, "timezone") || "Europe/Vilnius",
      registration_deadline: text(formData, "registration_deadline") || null,
      registration_status: oneOf(text(formData, "registration_status"), REGISTRATION, "unknown"),
      registration_url: text(formData, "registration_url") || null,
      official_url: text(formData, "official_url") || null,
      source_id: sourceId,
      source_url: sourceUrl,
      source_external_id: text(formData, "source_external_id") || null,
      surface: oneOf(text(formData, "surface"), SURFACES, "hard"),
      environment: oneOf(text(formData, "environment"), ENVIRONMENTS, "outdoor"),
      contact_name: text(formData, "contact_name") || null,
      contact_email: text(formData, "contact_email") || null,
      contact_phone: text(formData, "contact_phone") || null,
      image_url: text(formData, "image_url") || null,
      prize_summary: text(formData, "prize_summary") || null,
      lifecycle_status: oneOf(text(formData, "lifecycle_status"), LIFECYCLE, "upcoming"),
      verification_status: formData.get("verified") === "on" ? "verified" : "needs_verification",
      last_verified_at: formData.get("verified") === "on" ? now : null,
      published: formData.get("published") === "on",
      updated_at: now,
    };

    const saved = id
      ? await supabase.from("tournaments").update(row).eq("id", id).select("id").single()
      : await supabase.from("tournaments").insert(row).select("id").single();

    if (saved.error || !saved.data) return { error: saved.error?.message ?? "Could not save the tournament." };
    const tournamentId = saved.data.id as string;

    await supabase.from("tournament_categories").delete().eq("tournament_id", tournamentId);
    const categoryRows = categories.map((category, index) => ({
      tournament_id: tournamentId,
      discipline: oneOf(category.discipline ?? "", DISCIPLINES, "singles"),
      gender: oneOf(category.gender ?? "", GENDERS, "open"),
      age_min: numberOrNull(category.ageMin ?? ""),
      age_max: numberOrNull(category.ageMax ?? ""),
      age_label: category.ageLabel?.trim() || null,
      level: oneOf(category.level ?? "", LEVELS, "recreational"),
      ranking_requirement: category.rankingRequirement?.trim() || null,
      entry_fee_amount: numberOrNull(category.entryFeeAmount ?? ""),
      currency: category.currency?.trim().toUpperCase() || null,
      registration_deadline: category.registrationDeadline || null,
      registration_status: category.registrationStatus ? oneOf(category.registrationStatus, REGISTRATION, "unknown") : null,
      sort_order: index,
    }));
    const inserted = await supabase.from("tournament_categories").insert(categoryRows);
    if (inserted.error) return { error: inserted.error.message };

    const description = text(formData, "description");
    if (description) {
      await supabase.from("tournament_translations").upsert(
        [
          { tournament_id: tournamentId, locale: "en", description },
          { tournament_id: tournamentId, locale: "lt", description },
        ],
        { onConflict: "tournament_id,locale" },
      );
    }

    revalidatePath("/lt");
    revalidatePath("/en");
    revalidatePath("/lt/tournaments");
    revalidatePath("/en/tournaments");
    redirect(`/admin/${tournamentId}?saved=1`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "Save failed.";
    return { error: message };
  }
}

export async function setTournamentStatus(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id) return;
  const supabase = createServerSupabaseClient();
  const patch: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() };

  if (status === "verified") {
    patch.verification_status = "verified";
    patch.last_verified_at = new Date().toISOString();
  } else if (status === "archive") {
    patch.archived_at = new Date().toISOString();
    patch.published = false;
  } else if ((LIFECYCLE as readonly string[]).includes(status)) {
    patch.lifecycle_status = status;
  }

  await supabase.from("tournaments").update(patch).eq("id", id);
  revalidatePath("/lt/tournaments");
  revalidatePath("/en/tournaments");
  redirect("/admin");
}

async function uniqueSlug(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  base: string,
  currentId: string,
): Promise<string> {
  let slug = base;
  for (let i = 2; i < 50; i += 1) {
    const { data } = await supabase.from("tournaments").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === currentId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function numberOrNull(value: string): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}
