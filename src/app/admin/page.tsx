import AdminTournamentDesk from "@/components/admin/AdminTournamentDesk";
import { isCatalogSection } from "@/lib/tournaments/catalog";
import {
  getAdminTournamentStats,
  listAdminTournaments,
  type AdminListSort,
  type AdminListStatus,
} from "@/lib/tournaments/queries";
import type { CatalogSection } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

type AdminSection = CatalogSection | "all" | "local";

function parseSection(value: string | undefined): AdminSection {
  if (value === "all" || value === "local" || isCatalogSection(value)) return value;
  return "all";
}

function parseStatus(value: string | undefined): AdminListStatus {
  if (value === "listed" || value === "drafts" || value === "archived" || value === "needs_review") return value;
  return "all";
}

function parseSort(value: string | undefined): AdminListSort {
  return value === "latest" ? "latest" : "soonest";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    status?: string;
    q?: string;
    source?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const section = parseSection(params.section);
  const status = parseStatus(params.status);
  const sort = parseSort(params.sort);
  const q = params.q?.trim() ?? "";
  const source = params.source?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [list, stats] = await Promise.all([
    listAdminTournaments({ section, status, q, source, sort, page, pageSize: 8 }),
    getAdminTournamentStats(),
  ]);

  const filters = { status, section, q, source, sort, page };
  const returnTo = buildReturnTo(filters);

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
    />
  );
}

function buildReturnTo(filters: {
  status: AdminListStatus;
  section: AdminSection;
  q: string;
  source: string;
  sort: AdminListSort;
  page: number;
}): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.section !== "all") params.set("section", filters.section);
  if (filters.q) params.set("q", filters.q);
  if (filters.source) params.set("source", filters.source);
  if (filters.sort !== "soonest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}
