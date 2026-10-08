import { isValidEmail, normalizeEmail } from "@/lib/email";
import { EVENT_TYPES, ENVIRONMENTS, PLAY_LEVELS, SURFACES } from "@/lib/tournaments/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (typeof input.company === "string" && input.company.trim()) {
    return Response.json({ success: true }, { status: 201 });
  }

  const eventName = clip(input.eventName, 160);
  const eventType = typeof input.eventType === "string" ? input.eventType : "";
  const startsOn = typeof input.startsOn === "string" ? input.startsOn : "";
  const endsOn = typeof input.endsOn === "string" ? input.endsOn : "";
  const city = clip(input.city, 80);
  const officialUrl = clip(input.officialUrl, 500);
  const registrationUrl = clip(input.registrationUrl, 500);
  const submitterName = clip(input.submitterName, 120);
  const email = normalizeEmail(typeof input.submitterEmail === "string" ? input.submitterEmail : "");

  if (!eventName || !DATE.test(startsOn) || !city || !officialUrl || !submitterName || !email) {
    return Response.json({ error: "required" }, { status: 400 });
  }
  if (!isValidEmail(email)) return Response.json({ error: "email" }, { status: 400 });
  if (!isHttpUrl(officialUrl) || (registrationUrl && !isHttpUrl(registrationUrl))) {
    return Response.json({ error: "url" }, { status: 400 });
  }
  if (!EVENT_TYPES.includes(eventType as (typeof EVENT_TYPES)[number])) {
    return Response.json({ error: "required" }, { status: 400 });
  }
  if (endsOn && (!DATE.test(endsOn) || endsOn < startsOn)) {
    return Response.json({ error: "required" }, { status: 400 });
  }

  const surface = oneOf(input.surface, SURFACES);
  const environment = oneOf(input.environment, ENVIRONMENTS);
  const playLevel = oneOf(input.playLevel, PLAY_LEVELS);

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const { error } = await supabase.from("event_submissions").insert({
    event_name: eventName,
    event_type: eventType,
    organiser: clip(input.organiser, 160) || null,
    starts_on: startsOn,
    ends_on: endsOn || null,
    location: clip(input.location, 200) || null,
    city,
    official_url: officialUrl,
    registration_url: registrationUrl || null,
    surface,
    environment,
    play_level: playLevel,
    notes: clip(input.notes, 2000) || null,
    submitter_name: submitterName,
    submitter_email: email,
  });

  if (error) return Response.json({ error: "generic" }, { status: 500 });
  return Response.json({ success: true }, { status: 201 });
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}
