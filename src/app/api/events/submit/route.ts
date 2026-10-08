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
  const notes = await reviewNotes(input, {
    eventName,
    eventType,
    startsOn,
    endsOn,
    city,
    officialUrl,
    registrationUrl,
    submitterName,
  });

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
    notes,
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

async function reviewNotes(
  input: Record<string, unknown>,
  submission: {
    eventName: string;
    eventType: string;
    startsOn: string;
    endsOn: string;
    city: string;
    officialUrl: string;
    registrationUrl: string;
    submitterName: string;
  },
): Promise<string | null> {
  let notes = clip(input.notes, 1600);
  try {
    const { listTournaments } = await import("@/lib/tournaments/queries");
    const { preparePublication } = await import("@/lib/discovery/workflow");
    const listed = await listTournaments({ city: submission.city, page: 1 }, 40);
    const decision = preparePublication(
      listed.items.map((event) => ({
        id: event.id,
        title: event.name,
        startDate: event.startsOn,
        endDate: event.endsOn,
        city: event.city,
        venue: event.venueName,
        organiser: event.organizerName,
        officialEventUrl: event.officialUrl,
        registrationUrl: event.registrationUrl,
        sourceUrl: event.sourceUrl,
        sourceConfidence: event.sourceConfidence ?? "medium",
        registrationStatus: event.publicRegistration,
        surface: event.surface,
        priceAmount: event.priceAmount,
        currency: event.priceCurrency,
        sources: [
          {
            sourceName: event.sourceName ?? "Existing source",
            sourceUrl: event.sourceUrl,
            sourceType: "other" as const,
            sourceConfidence: event.sourceConfidence ?? "medium",
          },
        ],
      })),
      {
        title: submission.eventName,
        eventType: submission.eventType,
        startDate: submission.startsOn,
        endDate: submission.endsOn || null,
        city: submission.city,
        organiser: clip(input.organiser, 160) || null,
        officialEventUrl: submission.officialUrl,
        registrationUrl: submission.registrationUrl || null,
        sourceName: submission.submitterName,
        sourceUrl: submission.officialUrl,
        sourceType: "user_submission",
        sourceConfidence: "low",
      },
    );
    if (decision.action === "review" || decision.action === "attach_source") {
      const hint =
        decision.action === "review"
          ? decision.reason
          : "This matches an existing event. Attach the source instead of publishing a second event.";
      notes = [notes, hint].filter(Boolean).join("\n").slice(0, 2000);
    }
  } catch {
    // A failed duplicate check still leaves the submission for review.
  }
  return notes || null;
}
