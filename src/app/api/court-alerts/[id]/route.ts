import { getSessionUserId } from "@/lib/auth/session";
import { validateUpdatePayload } from "@/lib/court-alerts-validation";
import type { CourtAlert } from "@/lib/court-alerts-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveOwnerId(bodyClientId: string): Promise<string | null> {
  const sessionUserId = await getSessionUserId();
  return sessionUserId ?? bodyClientId;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = validateUpdatePayload(body);
  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const ownerId = await resolveOwnerId(validated.data.client_id);
  if (!ownerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { client_id, ...updates } = validated.data;
  void client_id;

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Court alerts are temporarily unavailable" }, { status: 500 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("court_alerts")
    .select("id")
    .eq("id", id)
    .eq("client_id", ownerId)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("court_alerts")
    .update(updates)
    .eq("id", id)
    .eq("client_id", ownerId)
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ alert: data as CourtAlert });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = validateUpdatePayload(body);
  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const ownerId = await resolveOwnerId(validated.data.client_id);
  if (!ownerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Court alerts are temporarily unavailable" }, { status: 500 });
  }

  const { error } = await supabase
    .from("court_alerts")
    .delete()
    .eq("id", id)
    .eq("client_id", ownerId);

  if (error) {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true });
}
