import { matchAlertsToSlots } from "@/lib/court-alerts-matcher";
import { sendCourtAlertEmail } from "@/lib/court-alert-email";
import type { CourtAlert } from "@/lib/court-alerts-types";
import type { AlertMatch } from "@/lib/court-monitoring-types";
import { getCourtAvailabilityProvider } from "@/lib/providers";
import type { CourtSlot } from "@/lib/providers/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface MonitorRunResult {
  alertsChecked: number;
  datesPolled: number;
  slotsFetched: number;
  matchesFound: number;
  emailsSent: number;
  errors: string[];
}

function uniqueDatesFromAlerts(alerts: CourtAlert[]): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const dates = new Set<string>();
  for (const alert of alerts) {
    if (alert.alert_date >= today) {
      dates.add(alert.alert_date);
    }
  }
  return [...dates];
}

function uniqueClubsFromAlerts(alerts: CourtAlert[]): string[] {
  return [...new Set(alerts.map((a) => a.club))];
}

async function loadActiveAlerts(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { data, error } = await supabase
    .from("court_alerts")
    .select("*")
    .eq("status", "active")
    .gte("alert_date", new Date().toISOString().slice(0, 10));

  if (error) throw new Error(error.message);
  return (data ?? []) as CourtAlert[];
}

async function loadNotifiedKeys(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  alertIds: string[],
): Promise<Set<string>> {
  if (alertIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("court_alert_events")
    .select("alert_id, court_id, slot_start")
    .in("alert_id", alertIds);

  if (error) throw new Error(error.message);

  const keys = new Set<string>();
  for (const row of data ?? []) {
    keys.add(`${row.alert_id}:${row.court_id}:${row.slot_start}`);
  }
  return keys;
}

async function upsertSnapshots(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  slots: CourtSlot[],
) {
  if (slots.length === 0) return;

  const rows = slots.map((slot) => ({
    club: slot.clubId,
    court_id: slot.courtId,
    slot_start: slot.start,
    slot_end: slot.end,
    status: slot.status,
    fetched_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("court_availability_snapshots").upsert(rows, {
    onConflict: "club,court_id,slot_start",
  });

  if (error) throw new Error(error.message);
}

async function recordEvent(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  match: AlertMatch,
) {
  const { error } = await supabase.from("court_alert_events").insert({
    alert_id: match.alertId,
    court_id: match.courtId,
    slot_start: match.slotStart,
    slot_end: match.slotEnd,
    slot_status: match.slotStatus,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export async function runCourtMonitor(): Promise<MonitorRunResult> {
  const result: MonitorRunResult = {
    alertsChecked: 0,
    datesPolled: 0,
    slotsFetched: 0,
    matchesFound: 0,
    emailsSent: 0,
    errors: [],
  };

  const supabase = createServerSupabaseClient();
  const provider = getCourtAvailabilityProvider();

  let alerts: CourtAlert[];
  try {
    alerts = await loadActiveAlerts(supabase);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Failed to load alerts");
    return result;
  }

  result.alertsChecked = alerts.length;
  if (alerts.length === 0) return result;

  const dates = uniqueDatesFromAlerts(alerts);
  const clubs = uniqueClubsFromAlerts(alerts);
  result.datesPolled = dates.length;

  const allSlots: CourtSlot[] = [];

  for (const club of clubs) {
    for (const date of dates) {
      try {
        const slots = await provider.fetchSlots({ clubId: club, date, sport: "tenisas" });
        allSlots.push(...slots);
      } catch (err) {
        result.errors.push(
          `Fetch ${club}/${date}: ${err instanceof Error ? err.message : "unknown error"}`,
        );
      }
    }
  }

  result.slotsFetched = allSlots.length;

  try {
    await upsertSnapshots(supabase, allSlots);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Failed to upsert snapshots");
  }

  let notifiedKeys: Set<string>;
  try {
    notifiedKeys = await loadNotifiedKeys(
      supabase,
      alerts.map((a) => a.id),
    );
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Failed to load events");
    return result;
  }

  const matches = matchAlertsToSlots(alerts, allSlots, notifiedKeys);
  result.matchesFound = matches.length;

  for (const match of matches) {
    try {
      await recordEvent(supabase, match);
      const sent = await sendCourtAlertEmail({ match, locale: "lt" });
      if (sent) result.emailsSent++;
    } catch (err) {
      result.errors.push(
        `Notify ${match.alertId}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
