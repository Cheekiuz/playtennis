import { getSessionUser, getSessionUserId } from "@/lib/auth/session";
import { validateCreatePayload } from "@/lib/court-alerts-validation";
import type { CourtAlert } from "@/lib/court-alerts-types";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export async function GET() {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Court alerts are temporarily unavailable" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("court_alerts")
    .select("*")
    .eq("client_id", sessionUserId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ alerts: (data ?? []) as CourtAlert[] });
}

export async function POST(request: Request) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getSessionUser();
  const sessionEmail = user?.email ? normalizeEmail(user.email) : null;
  if (!sessionEmail || !isValidEmail(sessionEmail)) {
    return Response.json({ error: "A verified email is required on your account" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = validateCreatePayload(body);
  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  validated.data.client_id = sessionUserId;
  validated.data.email = sessionEmail;

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Court alerts are temporarily unavailable" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("court_alerts")
    .insert(validated.data)
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ alert: data as CourtAlert }, { status: 201 });
}
