import { createClient } from "@supabase/supabase-js";

function cleanEnv(value: string | undefined) {
  if (!value) return undefined;
  return value.trim().replace(/^["']|["']$/g, "");
}

function getSupabaseConfig() {
  const url =
    cleanEnv(process.env.SUPABASE_URL) ??
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Vercel Supabase integration uses SUPABASE_SECRET_KEY (new sb_secret_* format).
  // Legacy setups use SUPABASE_SERVICE_ROLE_KEY.
  const key =
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    cleanEnv(process.env.SUPABASE_SECRET_KEY);

  if (!url || !key || key.includes("SENSITIVE")) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL + SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return { url, key };
}

export function createServerSupabaseClient() {
  const { url, key } = getSupabaseConfig();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
