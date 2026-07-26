import type { CourtSlotStatus } from "@/lib/providers/types";

export interface CourtAvailabilitySnapshot {
  id: string;
  club: string;
  court_id: string;
  slot_start: string;
  slot_end: string;
  status: CourtSlotStatus;
  fetched_at: string;
}

export interface CourtAlertEvent {
  id: string;
  alert_id: string;
  court_id: string;
  slot_start: string;
  slot_end: string;
  slot_status: CourtSlotStatus;
  notified_at: string;
}

export interface AlertMatch {
  alertId: string;
  email: string | null;
  notifyEmail: boolean;
  club: string;
  courtId: string;
  courtLabel: string;
  slotStart: string;
  slotEnd: string;
  slotStatus: CourtSlotStatus;
}
