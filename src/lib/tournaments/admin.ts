import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const nextPath = await adminReturnPath();
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);

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
    redirect(`/auth/admin-required?email=${encodeURIComponent(user.email ?? "")}`);
  }

  redirect(`/auth/admin-required?email=${encodeURIComponent(user.email ?? "")}`);
}

async function adminReturnPath(): Promise<string> {
  try {
    const headerList = await headers();
    const path = headerList.get("x-pathname");
    if (path?.startsWith("/admin")) return path;
  } catch {
    // headers() unavailable in some contexts
  }
  return "/admin";
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
