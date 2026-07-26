import { NextResponse } from "next/server";
import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";
import { isAuthConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createAuthSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
