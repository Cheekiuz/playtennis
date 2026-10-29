import AdminTournamentDesk from "@/components/admin/AdminTournamentDesk";
import { isCatalogSection } from "@/lib/tournaments/catalog";
import {
  getAdminTournamentStats,
  listAdminTournaments,
  type AdminListSort,
} from "@/lib/tournaments/queries";
import type { CatalogSection } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

type AdminSection = CatalogSection | "all" | "local";

function parseSection(value: string | undefined): AdminSection {
  if (value === "all" || value === "local" || isCatalogSection(value)) return value;
  return "all";
}

function parseSort(value: string | undefined): AdminListSort {
  return value === "latest" ? "latest" : "soonest";
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    q?: string;
    source?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const section = parseSection(params.section);
  const sort = parseSort(params.sort);
  const q = params.q?.trim() ?? "";
  const source = params.source?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [list, stats] = await Promise.all([
    listAdminTournaments({
      section,
      status: "needs_review",
      q,
      source,
      sort,
      page,
      pageSize: 8,
    }),
    getAdminTournamentStats(),
  ]);

  const filters = {
    status: "needs_review" as const,
    section,
    q,
    source,
    sort,
    page,
  };

  const returnParams = new URLSearchParams();
  if (section !== "all") returnParams.set("section", section);
  if (q) returnParams.set("q", q);
  if (source) returnParams.set("source", source);
  if (sort !== "soonest") returnParams.set("sort", sort);
  if (page > 1) returnParams.set("page", String(page));
  const query = returnParams.toString();
  const returnTo = query ? `/admin/review?${query}` : "/admin/review";

  return (
    <AdminTournamentDesk
      tournaments={list.items}
      total={list.total}
      page={list.page}
      pageSize={list.pageSize}
      stats={stats}
      filters={filters}
      sources={list.sources}
      returnTo={returnTo}
      title="Review queue"
      subtitle="Events waiting for an editorial check before they stay trusted."
      showStats={false}
      showStatusTabs={false}
      basePath="/admin/review"
    />
  );
}
