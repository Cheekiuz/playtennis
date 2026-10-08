import { redirect } from "next/navigation";
import { isValidLocale, localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EventsAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/");

  const raw = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const text = Array.isArray(value) ? value[0] : value;
    if (text) query.set(key, text);
  }
  const suffix = query.toString();
  const target = localePath(locale, "/tournaments");
  redirect(suffix ? `${target}?${suffix}` : target);
}
