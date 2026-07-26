import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";
import { isAuthConfigured } from "@/lib/supabase/config";

export async function getSessionUserId(): Promise<string | null> {
  if (!isAuthConfigured()) return null;

  try {
    const supabase = await createAuthSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  if (!isAuthConfigured()) return null;

  try {
    const supabase = await createAuthSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}
