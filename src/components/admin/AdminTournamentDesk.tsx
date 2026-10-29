"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setTournamentStatus } from "@/app/admin/actions";
import { adminSourceLabel, needsAdminReview } from "@/lib/tournaments/admin-helpers";
import type { AdminListSort, AdminListStatus, AdminTournamentStats } from "@/lib/tournaments/queries";
import type { CatalogSection, TournamentRecord } from "@/lib/tournaments/types";

export type AdminDeskFilters = {
  status: AdminListStatus;
  section: CatalogSection | "all" | "local";
  q: string;
  source: string;
  sort: AdminListSort;
  page: number;
};

export default function AdminTournamentDesk({
  tournaments,
  total,
  page,
  pageSize,
  stats,
  filters,
  sources,
  returnTo,
  title = "The Editorial Desk",
  subtitle = "Keep the calendar in play. A little less admin. A lot more tennis.",
  showStats = true,
  showStatusTabs = true,
  basePath = "/admin",
}: {
  tournaments: TournamentRecord[];
  total: number;
  page: number;
  pageSize: number;
  stats: AdminTournamentStats;
  filters: AdminDeskFilters;
  sources: string[];
  returnTo: string;
  title?: string;
  subtitle?: string;
  showStats?: boolean;
  showStatusTabs?: boolean;
  basePath?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">{title}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">{subtitle}</h1>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center rounded-md bg-[#c8ff00] px-4 py-2.5 text-sm font-bold text-[#111915] hover:bg-[#d4ff33]"
        >
          + Add tournament
        </Link>
      </div>

      {showStats ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total listings" value={stats.total} hint="All records" />
          <StatCard label="Listed" value={stats.listed} hint="Visible in the calendar" />
          <StatCard label="Drafts" value={stats.drafts} hint="Not yet listed" />
          <StatCard label="Needs review" value={stats.needsReview} hint="Awaiting editorial check" />
        </div>
      ) : null}

      {showStatusTabs ? (
        <div className="mt-8 flex flex-wrap gap-1 border-b border-[#e7e7e2]">
          {(
            [
              ["all", "All listings", stats.total],
              ["listed", "Listed", stats.listed],
              ["drafts", "Drafts", stats.drafts],
              ["archived", "Archived", stats.archived],
            ] as const
          ).map(([key, label, count]) => {
            const active = filters.status === key;
            return (
              <Link
                key={key}
                href={hrefWith(basePath, filters, { status: key, page: 1 })}
                className={
                  active
                    ? "-mb-px border-b-2 border-[#111915] px-3 py-2 text-sm font-semibold text-[#111915]"
                    : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-[#747874] hover:text-[#111915]"
                }
              >
                {label}
                <span className="ml-1.5 text-xs tabular-nums text-[#747874]">{count}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <form method="get" action={basePath} className="mt-4 flex flex-wrap items-end gap-2">
        {filters.status !== "all" && showStatusTabs ? (
          <input type="hidden" name="status" value={filters.status} />
        ) : null}
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[#747874]">
          Search
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search name or city..."
            className="mt-1 w-full rounded-md border border-[#e7e7e2] bg-white px-3 py-2 text-sm text-[#111915] outline-none focus:border-[#111915]"
          />
        </label>
        <label className="text-xs font-semibold text-[#747874]">
          Region
          <select
            name="section"
            defaultValue={filters.section}
            className="mt-1 block rounded-md border border-[#e7e7e2] bg-white px-3 py-2 text-sm text-[#111915]"
          >
            <option value="all">All regions</option>
            <option value="local">Local (LT + Baltics)</option>
            <option value="lithuania">Lithuania</option>
            <option value="baltics">Baltics</option>
            <option value="itf">ITF</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#747874]">
          Source
          <select
            name="source"
            defaultValue={filters.source}
            className="mt-1 block max-w-[12rem] rounded-md border border-[#e7e7e2] bg-white px-3 py-2 text-sm text-[#111915]"
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#747874]">
          Date
          <select
            name="sort"
            defaultValue={filters.sort}
            className="mt-1 block rounded-md border border-[#e7e7e2] bg-white px-3 py-2 text-sm text-[#111915]"
          >
            <option value="soonest">Date: soonest</option>
            <option value="latest">Date: latest</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-[#111915] bg-[#111915] px-3 py-2 text-xs font-semibold text-[#c8ff00]"
        >
          Apply
        </button>
        <Link href={basePath} className="px-2 py-2 text-xs font-semibold text-[#747874] hover:text-[#111915]">
          Clear
        </Link>
      </form>

      {tournaments.length === 0 ? (
        <p className="mt-8 rounded-md border border-[#e7e7e2] bg-white px-4 py-8 text-sm text-[#747874]">
          No tournaments in this view.
          {(filters.status === "all" || filters.status === "listed" || filters.status === "drafts") && (
            <>
              {" "}
              Import Facebook events from{" "}
              <Link href="/admin/facebook" className="font-semibold text-[#111915] underline-offset-2 hover:underline">
                Sources
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-[#e7e7e2] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="border-b border-[#e7e7e2] bg-[#f3f4f3] text-[11px] font-bold uppercase tracking-[0.08em] text-[#747874]">
              <tr>
                <th className="px-4 py-3 font-bold">Tournament</th>
                <th className="px-4 py-3 font-bold">Dates</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <TournamentRow key={tournament.id} tournament={tournament} returnTo={returnTo} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#747874]">
        <p>
          Showing {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-2">
          <span>
            Page {page} of {pageCount}
          </span>
          <Link
            aria-disabled={page <= 1}
            className={pageLinkClass(page <= 1)}
            href={page <= 1 ? returnTo : hrefWith(basePath, filters, { page: page - 1 })}
          >
            ←
          </Link>
          <Link
            aria-disabled={page >= pageCount}
            className={pageLinkClass(page >= pageCount)}
            href={page >= pageCount ? returnTo : hrefWith(basePath, filters, { page: page + 1 })}
          >
            →
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#747874]">
        * &ldquo;Listed&rdquo; means published on the live calendar. Drafts stay hidden until you publish them.
      </p>
    </div>
  );
}

function TournamentRow({ tournament, returnTo }: { tournament: TournamentRecord; returnTo: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const awaiting = needsAdminReview(tournament);
  const source = adminSourceLabel(tournament);
  const status = tournament.archivedAt ? "Archived" : tournament.published ? "Listed" : "Draft";
  const discipline = disciplineLabel(tournament);
  const age = tournament.ageGroup || tournament.categories[0]?.ageLabel || null;

  function runStatus(nextStatus: string) {
    const formData = new FormData();
    formData.set("id", tournament.id);
    formData.set("status", nextStatus);
    formData.set("return_to", returnTo);
    startTransition(() => {
      void setTournamentStatus(formData);
    });
    setOpen(false);
  }

  return (
    <tr className="border-b border-[#e7e7e2] last:border-b-0">
      <td className="px-4 py-3 align-top">
        <Link href={`/admin/${tournament.id}`} className="font-semibold text-[#111915] hover:underline">
          {tournament.name}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#747874]">
          <span>{tournament.city}</span>
          {discipline ? (
            <>
              <span>·</span>
              <span>{discipline}</span>
            </>
          ) : null}
          {tournament.isTest ? (
            <span className="rounded bg-[#e2e2e2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#434845]">
              Sample
            </span>
          ) : null}
        </p>
      </td>
      <td className="px-4 py-3 align-top tabular-nums">
        <p className="font-semibold text-[#111915]">{formatDateRange(tournament.startsOn, tournament.endsOn)}</p>
        <p className="mt-1 text-xs text-[#747874]">
          {tournament.startsOn.slice(0, 4)}
          {age ? ` · ${age}` : ""}
        </p>
      </td>
      <td className="px-4 py-3 align-top">
        <p className="font-semibold text-[#111915]">{source}</p>
        <p className="mt-1 text-xs text-[#747874]">{awaiting ? "Awaiting review" : "Reviewed"}</p>
      </td>
      <td className="px-4 py-3 align-top">
        <span
          className={
            status === "Listed"
              ? "inline-flex rounded-md bg-[#e8f5c8] px-2 py-1 text-[11px] font-bold text-[#3c4d00]"
              : status === "Draft"
                ? "inline-flex rounded-md bg-[#eeeeed] px-2 py-1 text-[11px] font-bold text-[#434845]"
                : "inline-flex rounded-md bg-[#ffdad6] px-2 py-1 text-[11px] font-bold text-[#93000a]"
          }
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="relative flex items-center gap-2">
          <Link
            href={`/admin/${tournament.id}`}
            className="rounded-md border border-[#e7e7e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#111915] hover:border-[#111915]"
          >
            Edit
          </Link>
          <button
            type="button"
            aria-label="More actions"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md border border-[#e7e7e2] px-2 py-1.5 text-xs font-bold text-[#747874] hover:border-[#111915] hover:text-[#111915]"
          >
            ⋮
          </button>
          {open ? (
            <div className="absolute right-0 top-9 z-10 min-w-[10rem] rounded-md border border-[#e7e7e2] bg-white py-1 shadow-[2px_2px_0_#111915]">
              {!tournament.archivedAt && !tournament.published ? (
                <MenuButton disabled={pending} onClick={() => runStatus("publish")} label="Publish" />
              ) : null}
              {!tournament.archivedAt && tournament.published ? (
                <MenuButton disabled={pending} onClick={() => runStatus("unpublish")} label="Unpublish" />
              ) : null}
              {awaiting ? <MenuButton disabled={pending} onClick={() => runStatus("verified")} label="Mark verified" /> : null}
              {!tournament.archivedAt ? (
                <MenuButton disabled={pending} onClick={() => runStatus("archive")} label="Archive" />
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function MenuButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#111915] hover:bg-[#f3f4f3] disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-md border border-[#e7e7e2] bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747874]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#111915]">{value}</p>
      <p className="mt-1 text-xs text-[#747874]">{hint}</p>
    </div>
  );
}

function hrefWith(
  basePath: string,
  filters: AdminDeskFilters,
  patch: Partial<AdminDeskFilters>,
): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (basePath === "/admin" && next.status && next.status !== "all") params.set("status", next.status);
  if (next.section && next.section !== "all") params.set("section", next.section);
  if (next.q) params.set("q", next.q);
  if (next.source) params.set("source", next.source);
  if (next.sort && next.sort !== "soonest") params.set("sort", next.sort);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function pageLinkClass(disabled: boolean) {
  return disabled
    ? "inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded border border-[#e7e7e2] text-[#c3c8c3]"
    : "inline-flex h-7 w-7 items-center justify-center rounded border border-[#e7e7e2] text-[#111915] hover:border-[#111915]";
}

function formatDateRange(startsOn: string, endsOn: string): string {
  const start = formatDay(startsOn);
  const end = formatDay(endsOn);
  if (startsOn === endsOn) return start;
  return `${start} – ${end}`;
}

function formatDay(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function disciplineLabel(tournament: TournamentRecord): string | null {
  if (tournament.catalogSection === "itf" || tournament.itfCategory) return "ITF Masters";
  const first = tournament.categories[0]?.discipline;
  if (!first) {
    if (tournament.eventFormat === "SINGLES") return "Singles";
    if (tournament.eventFormat === "MEN_DOUBLES" || tournament.eventFormat === "WOMEN_DOUBLES") return "Doubles";
    if (tournament.eventFormat === "MIXED_DOUBLES") return "Mixed";
    return null;
  }
  if (first === "singles") return "Singles";
  if (first === "doubles") return "Doubles";
  if (first === "mixed_doubles") return "Mixed";
  return first;
}
