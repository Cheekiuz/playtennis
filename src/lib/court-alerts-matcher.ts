import type { CourtAlert } from "@/lib/court-alerts-types";
import type { CourtLabelMessages } from "@/lib/court-alerts-config";
import { getCourtLabel } from "@/lib/court-alerts-config";
import type { AlertMatch } from "@/lib/court-monitoring-types";
import type { CourtSlot } from "@/lib/providers/types";

const NOTIFY_STATUSES = new Set(["available", "for_sale"]);

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

function slotOverlapsAlert(slot: CourtSlot, alert: CourtAlert): boolean {
  const slotStart = new Date(slot.start);
  const slotEnd = new Date(slot.end);
  const alertStartMin = parseTimeToMinutes(alert.time_start);
  const alertEndMin = parseTimeToMinutes(alert.time_end);

  const slotStartMin = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMin = slotEnd.getHours() * 60 + slotEnd.getMinutes();

  if (slotEndMin <= alertStartMin || slotStartMin >= alertEndMin) {
    return false;
  }

  if (alert.court !== "any" && alert.court !== slot.courtId) {
    return false;
  }

  return true;
}

function slotDateMatchesAlert(slot: CourtSlot, alert: CourtAlert): boolean {
  const slotDate = slot.start.slice(0, 10);
  return slotDate === alert.alert_date;
}

export function matchAlertsToSlots(
  alerts: CourtAlert[],
  slots: CourtSlot[],
  alreadyNotified: Set<string>,
): AlertMatch[] {
  const matches: AlertMatch[] = [];

  for (const alert of alerts) {
    if (alert.status !== "active") continue;

    for (const slot of slots) {
      if (slot.clubId !== alert.club) continue;
      if (!NOTIFY_STATUSES.has(slot.status)) continue;
      if (!slotDateMatchesAlert(slot, alert)) continue;
      if (!slotOverlapsAlert(slot, alert)) continue;

      const key = `${alert.id}:${slot.courtId}:${slot.start}`;
      if (alreadyNotified.has(key)) continue;

      matches.push({
        alertId: alert.id,
        email: alert.email,
        notifyEmail: alert.notify_email,
        club: alert.club,
        courtId: slot.courtId,
        courtLabel: slot.courtLabel,
        slotStart: slot.start,
        slotEnd: slot.end,
        slotStatus: slot.status,
      });
    }
  }

  return matches;
}

export function formatSlotTimeRange(start: string, end: string, locale: string): string {
  const loc = locale === "lt" ? "lt-LT" : "en-US";
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const s = new Date(start).toLocaleTimeString(loc, opts);
  const e = new Date(end).toLocaleTimeString(loc, opts);
  return `${s}–${e}`;
}

export function getCourtDisplayLabel(
  courtId: string,
  club: string,
  messages: CourtLabelMessages,
): string {
  return getCourtLabel(courtId, club, messages);
}
