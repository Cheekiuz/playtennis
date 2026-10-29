import Link from "next/link";
import { notFound } from "next/navigation";
import TournamentForm from "@/components/admin/TournamentForm";
import { getAdminTournament } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export default async function EditTournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const tournament = await getAdminTournament(id);
  if (!tournament) notFound();
  const { saved } = await searchParams;

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Tournaments</p>
      <div className="mt-1 mb-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">{tournament.name}</h1>
        <Link href="/admin" className="text-sm font-semibold text-[#747874] hover:text-[#111915]">
          ← Back to desk
        </Link>
      </div>
      {saved ? <p className="mb-4 text-sm font-semibold text-[#3c4d00]">Saved.</p> : null}
      <p className="mb-6 text-sm text-[#747874]">
        {tournament.verificationStatus}
        {tournament.lastVerifiedAt ? ` · last verified ${tournament.lastVerifiedAt.slice(0, 10)}` : ""}
        {tournament.archivedAt ? " · archived" : tournament.published ? " · listed" : " · draft"}
      </p>
      <TournamentForm tournament={tournament} />
    </div>
  );
}
