import { isValidEmail, normalizeEmail } from "@/lib/email";
import type { CreateAlertPayload, UpdateAlertPayload } from "@/lib/court-alerts-types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidClientId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function parseTime(value: string): string | null {
  if (!TIME_RE.test(value)) return null;
  const [h, m] = value.split(":");
  return `${h}:${m}:00`;
}

function parseDate(value: string): string | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

export function validateCreatePayload(body: unknown): { data: CreateAlertPayload } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.city !== "string" || !b.city.trim()) {
    return { error: "City is required" };
  }

  if (typeof b.club !== "string" || !b.club.trim()) {
    return { error: "Club is required" };
  }

  if (typeof b.alert_date !== "string") {
    return { error: "Date is required" };
  }
  const alertDate = parseDate(b.alert_date);
  if (!alertDate) {
    return { error: "Invalid date" };
  }

  if (typeof b.time_start !== "string" || typeof b.time_end !== "string") {
    return { error: "Time range is required" };
  }
  const timeStart = parseTime(b.time_start);
  const timeEnd = parseTime(b.time_end);
  if (!timeStart || !timeEnd) {
    return { error: "Invalid time range" };
  }
  if (timeStart >= timeEnd) {
    return { error: "End time must be after start time" };
  }

  const court = typeof b.court === "string" ? b.court : "any";

  return {
    data: {
      client_id: "",
      city: b.city.trim(),
      club: b.club.trim(),
      alert_date: alertDate,
      time_start: timeStart,
      time_end: timeEnd,
      court,
      notify_push: false,
      notify_email: true,
      email: "",
    },
  };
}

export function validateUpdatePayload(body: unknown): { data: UpdateAlertPayload } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;

  const data: UpdateAlertPayload = { client_id: "" };

  if (b.city !== undefined) {
    if (typeof b.city !== "string" || !b.city.trim()) return { error: "Invalid city" };
    data.city = b.city.trim();
  }

  if (b.club !== undefined) {
    if (typeof b.club !== "string" || !b.club.trim()) return { error: "Invalid club" };
    data.club = b.club.trim();
  }

  if (b.alert_date !== undefined) {
    if (typeof b.alert_date !== "string") return { error: "Invalid date" };
    const alertDate = parseDate(b.alert_date);
    if (!alertDate) return { error: "Invalid date" };
    data.alert_date = alertDate;
  }

  if (b.time_start !== undefined) {
    if (typeof b.time_start !== "string") return { error: "Invalid start time" };
    const timeStart = parseTime(b.time_start);
    if (!timeStart) return { error: "Invalid start time" };
    data.time_start = timeStart;
  }

  if (b.time_end !== undefined) {
    if (typeof b.time_end !== "string") return { error: "Invalid end time" };
    const timeEnd = parseTime(b.time_end);
    if (!timeEnd) return { error: "Invalid end time" };
    data.time_end = timeEnd;
  }

  if (b.court !== undefined) {
    if (typeof b.court !== "string") return { error: "Invalid court" };
    data.court = b.court;
  }

  if (b.email !== undefined) {
    if (b.email === null) {
      return { error: "Email is required" };
    }
    if (typeof b.email === "string") {
      const email = normalizeEmail(b.email);
      if (!isValidEmail(email)) return { error: "Invalid email address" };
      data.email = email;
      data.notify_email = true;
      data.notify_push = false;
    } else {
      return { error: "Invalid email" };
    }
  }

  if (b.status !== undefined) {
    if (b.status !== "active" && b.status !== "paused") {
      return { error: "Invalid status" };
    }
    data.status = b.status;
  }

  return { data };
}

export function formatTimeForDisplay(time: string): string {
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
}

export function formatDateForDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(locale === "lt" ? "lt-LT" : "en-US", {
    weekday: "long",
  });
}
