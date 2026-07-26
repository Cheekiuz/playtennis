import { createClient } from "@supabase/supabase-js";

function cleanEnv(value: string | undefined) {
  if (!value) return undefined;
  return value.trim().replace(/^["']|["']$/g, "");
}

function isUsableKey(value: string | undefined): value is string {
  const key = cleanEnv(value);
  return Boolean(key && !key.includes("SENSITIVE"));
}

function getSupabaseKey() {
  const candidates = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];

  for (const candidate of candidates) {
    if (isUsableKey(candidate)) {
      return cleanEnv(candidate)!;
    }
  }

  return undefined;
}

function getSupabaseConfig() {
  const url =
    cleanEnv(process.env.SUPABASE_URL) ??
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const key = getSupabaseKey();

  if (!url || !key) {
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
