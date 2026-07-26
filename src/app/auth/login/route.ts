import { NextResponse } from "next/server";
import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";
import { isAuthConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return Response.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createAuthSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return Response.json({ error: "Could not start Google sign-in" }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}
