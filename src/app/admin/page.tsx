import Link from "next/link";
import { setTournamentStatus } from "@/app/admin/actions";
import { listAdminTournaments } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tournaments = await listAdminTournaments();

  return (
    <div>
      <h1 className="text-3xl font-bold">Tournaments</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Run supabase/tournaments.sql before the first save. Publish only after the official page has been checked. A wrong date is worse than a missing tournament.
      </p>
      {tournaments.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">No tournaments yet.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {tournaments.map((tournament) => (
            <li key={tournament.id} className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3">
              <div>
                <Link href={`/admin/${tournament.id}`} className="font-semibold hover:text-accent">
                  {tournament.name}
                </Link>
                <p className="text-sm text-foreground/70">
                  {tournament.city} · {tournament.startsOn} · {tournament.lifecycleStatus} · {tournament.verificationStatus}
                  {tournament.published ? " · published" : " · draft"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusButton id={tournament.id} status="verified" label="Verify" />
                <StatusButton id={tournament.id} status="cancelled" label="Cancel" />
                <StatusButton id={tournament.id} status="postponed" label="Postpone" />
                <StatusButton id={tournament.id} status="archive" label="Archive" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setTournamentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="border border-border px-3 py-1 text-xs font-semibold">
        {label}
      </button>
    </form>
  );
}
