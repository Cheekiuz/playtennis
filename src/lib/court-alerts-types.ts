export type AlertStatus = "active" | "paused";

export interface CourtAlert {
  id: string;
  client_id: string;
  city: string;
  club: string;
  alert_date: string;
  time_start: string;
  time_end: string;
  court: string;
  notify_push: boolean;
  notify_email: boolean;
  email: string | null;
  status: AlertStatus;
  created_at: string;
}

export interface CreateAlertPayload {
  client_id: string;
  city: string;
  club: string;
  alert_date: string;
  time_start: string;
  time_end: string;
  court: string;
  notify_push: boolean;
  notify_email: boolean;
  email?: string | null;
}

export interface UpdateAlertPayload {
  client_id: string;
  city?: string;
  club?: string;
  alert_date?: string;
  time_start?: string;
  time_end?: string;
  court?: string;
  notify_push?: boolean;
  notify_email?: boolean;
  email?: string | null;
  status?: AlertStatus;
}
