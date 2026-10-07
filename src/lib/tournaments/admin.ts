import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && allow.includes(user.email.toLowerCase())) return user;

  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (data?.role === "admin") return user;
  } catch {
    redirect("/lt");
  }

  redirect("/lt");
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "tournament";
}
