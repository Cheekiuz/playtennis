import { NextResponse } from "next/server";
import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";
import { isAuthConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return Response.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  const supabase = await createAuthSupabaseClient();
  await supabase.auth.signOut();

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  return NextResponse.redirect(new URL(next, request.url));
}

export async function GET(request: Request) {
  return POST(request);
}
