import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Turn on public listing for upcoming rows ingested from dedicated site adapters (draft cleanup). */
export async function reconcileRegistryPublicListings(): Promise<{ updated: number }> {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, metadata")
    .eq("active", true);

  if (sourcesError || !sources?.length) {
    return { updated: 0 };
  }

  const adapterSourceIds = sources
    .filter((row) => {
      const metadata = row.metadata as Record<string, unknown> | null;
      return typeof metadata?.adapter === "string" && metadata.adapter.length > 0;
    })
    .map((row) => String(row.id));

  if (adapterSourceIds.length === 0) return { updated: 0 };

  const { data, error } = await supabase
    .from("tournaments")
    .update({
      published: true,
      review_status: "needs_review",
      updated_at: new Date().toISOString(),
    })
    .in("source_id", adapterSourceIds)
    .eq("published", false)
    .gte("ends_on", today)
    .select("id");

  if (error) return { updated: 0 };
  return { updated: data?.length ?? 0 };
}
