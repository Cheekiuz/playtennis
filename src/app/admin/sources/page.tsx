import Link from "next/link";
import { loadAdminRegistrySources } from "@/lib/discovery/registry";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await loadAdminRegistrySources();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Sources</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">
            Where calendar rows come from
          </h1>
          <p className="mt-2 text-sm text-[#747874]">
            Registry sources power ingest and Facebook paste. Import stays a dedicated flow.
          </p>
        </div>
        <Link
          href="/admin/facebook"
          className="inline-flex items-center rounded-md bg-[#c8ff00] px-4 py-2.5 text-sm font-bold text-[#111915] hover:bg-[#d4ff33]"
        >
          Import Facebook events
        </Link>
      </div>

      {sources.length === 0 ? (
        <p className="mt-8 rounded-md border border-[#e7e7e2] bg-white px-4 py-8 text-sm text-[#747874]">
          No sources found yet.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-[#e7e7e2] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="border-b border-[#e7e7e2] bg-[#f3f4f3] text-[11px] font-bold uppercase tracking-[0.08em] text-[#747874]">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Place</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last checked</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-[#e7e7e2] last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-[#111915]">{source.sourceName}</p>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-xs text-[#747874] hover:underline"
                      >
                        {source.url}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top text-[#434845]">
                    {source.registrySourceType.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 align-top text-[#434845]">
                    {[source.city, source.countryCode?.toUpperCase()].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={
                        source.active
                          ? "inline-flex rounded-md bg-[#e8f5c8] px-2 py-1 text-[11px] font-bold text-[#3c4d00]"
                          : "inline-flex rounded-md bg-[#eeeeed] px-2 py-1 text-[11px] font-bold text-[#434845]"
                      }
                    >
                      {source.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs tabular-nums text-[#747874]">
                    {source.lastChecked ? formatStamp(source.lastChecked) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
