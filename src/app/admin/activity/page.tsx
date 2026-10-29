import Link from "next/link";
import {
  listAdminIngestRuns,
  listRecentlyUpdatedAdminTournaments,
} from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const [runs, recent] = await Promise.all([
    listAdminIngestRuns(20),
    listRecentlyUpdatedAdminTournaments(12),
  ]);

  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Activity</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">
          Recent ingest and edits
        </h1>
        <p className="mt-2 text-sm text-[#747874]">
          Ingest runs from collectors, plus tournaments touched most recently.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#747874]">Ingest runs</h2>
        {runs.length === 0 ? (
          <p className="mt-3 rounded-md border border-[#e7e7e2] bg-white px-4 py-6 text-sm text-[#747874]">
            No ingest runs recorded yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#e7e7e2] overflow-hidden rounded-md border border-[#e7e7e2] bg-white">
            {runs.map((run) => (
              <li key={run.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-[#111915]">{run.sourceKey}</p>
                  <p className="mt-1 text-xs text-[#747874]">
                    {formatStamp(run.startedAt)}
                    {run.finishedAt ? ` → ${formatStamp(run.finishedAt)}` : ""}
                  </p>
                  {run.error ? <p className="mt-1 text-xs text-[#93000a]">{run.error}</p> : null}
                </div>
                <div className="text-right text-xs text-[#747874]">
                  <p className="font-bold uppercase tracking-wide text-[#111915]">{run.status}</p>
                  <p className="mt-1 tabular-nums">
                    {run.fetched} fetched · {run.upserted} upserted · {run.skipped} skipped
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#747874]">Recently updated</h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-md border border-[#e7e7e2] bg-white px-4 py-6 text-sm text-[#747874]">
            No recent tournament updates.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#e7e7e2] overflow-hidden rounded-md border border-[#e7e7e2] bg-white">
            {recent.map((tournament) => (
              <li key={tournament.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link href={`/admin/${tournament.id}`} className="font-semibold text-[#111915] hover:underline">
                    {tournament.name}
                  </Link>
                  <p className="mt-1 text-xs text-[#747874]">
                    {tournament.city} · {tournament.startsOn}
                    {tournament.published ? " · listed" : " · draft"}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-[#747874]">{formatStamp(tournament.updatedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
