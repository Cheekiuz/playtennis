import type { CourtSlot } from "@/lib/providers/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function upsertAvailabilitySnapshots(slots: CourtSlot[]): Promise<void> {
  if (slots.length === 0) return;

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const rows = slots.map((slot) => ({
    club: slot.clubId,
    court_id: slot.courtId,
    slot_start: slot.start,
    slot_end: slot.end,
    status: slot.status,
    fetched_at: new Date().toISOString(),
  }));

  await supabase.from("court_availability_snapshots").upsert(rows, {
    onConflict: "club,court_id,slot_start",
  });
}

export async function loadSnapshotsFromDb(
  club: string,
  date: string,
): Promise<CourtSlot[]> {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return [];
  }

  const dayStart = `${date}T00:00:00+03:00`;
  const dayEnd = `${date}T23:59:59+03:00`;

  const { data, error } = await supabase
    .from("court_availability_snapshots")
    .select("club, court_id, slot_start, slot_end, status, fetched_at")
    .eq("club", club)
    .gte("slot_start", dayStart)
    .lte("slot_start", dayEnd)
    .order("fetched_at", { ascending: false });

  if (error || !data?.length) return [];

  const seen = new Set<string>();
  const slots: CourtSlot[] = [];

  for (const row of data) {
    const key = `${row.court_id}:${row.slot_start}`;
    if (seen.has(key)) continue;
    seen.add(key);

    slots.push({
      clubId: row.club,
      courtId: row.court_id,
      courtLabel: row.court_id,
      start: row.slot_start,
      end: row.slot_end,
      status: row.status as CourtSlot["status"],
    });
  }

  return slots;
}
