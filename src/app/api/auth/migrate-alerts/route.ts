import { isValidClientId } from "@/lib/court-alerts-validation";
import { getSessionUserId } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fromClientId =
    body && typeof body === "object" && "from_client_id" in body
      ? (body as { from_client_id: unknown }).from_client_id
      : null;

  if (!isValidClientId(fromClientId) || fromClientId === userId) {
    return Response.json({ migrated: 0 });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return Response.json({ error: "Migration unavailable" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("court_alerts")
    .update({ client_id: userId })
    .eq("client_id", fromClientId)
    .select("id");

  if (error) {
    return Response.json({ error: "Migration failed" }, { status: 500 });
  }

  return Response.json({ migrated: data?.length ?? 0 });
}
