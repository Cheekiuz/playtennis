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
      <h1 className="mb-2 text-3xl font-bold">{tournament.name}</h1>
      {saved ? <p className="mb-4 text-sm text-accent">Saved.</p> : null}
      <p className="mb-6 text-sm text-foreground/70">
        {tournament.verificationStatus}
        {tournament.lastVerifiedAt ? ` · last verified ${tournament.lastVerifiedAt.slice(0, 10)}` : ""}
      </p>
      <TournamentForm tournament={tournament} />
    </div>
  );
}
