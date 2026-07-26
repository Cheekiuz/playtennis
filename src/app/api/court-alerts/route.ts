import { isValidClientId } from "@/lib/court-alerts-validation";
import { validateCreatePayload } from "@/lib/court-alerts-validation";
import type { CourtAlert } from "@/lib/court-alerts-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");

  if (!isValidClientId(clientId)) {
    return Response.json({ error: "Invalid client_id" }, { status: 400 });
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
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ alerts: (data ?? []) as CourtAlert[] });
}

export async function POST(request: Request) {
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
