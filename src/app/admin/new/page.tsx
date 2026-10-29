import Link from "next/link";
import TournamentForm from "@/components/admin/TournamentForm";

export const dynamic = "force-dynamic";

export default function NewTournamentPage() {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Tournaments</p>
      <div className="mt-1 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">New tournament</h1>
        <Link href="/admin" className="text-sm font-semibold text-[#747874] hover:text-[#111915]">
          ← Back to desk
        </Link>
      </div>
      <TournamentForm />
    </div>
  );
}
