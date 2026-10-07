import TournamentForm from "@/components/admin/TournamentForm";

export const dynamic = "force-dynamic";

export default function NewTournamentPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">New tournament</h1>
      <TournamentForm />
    </div>
  );
}
