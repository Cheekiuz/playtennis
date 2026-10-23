import Link from "next/link";
import AdminTournamentList from "@/components/admin/AdminTournamentList";
import { listAdminTournaments } from "@/lib/tournaments/queries";
import type { CatalogSection } from "@/lib/tournaments/types";

export const dynamic = "force-dynamic";

type AdminSection = CatalogSection | "all" | "local";

function parseSection(value: string | undefined): AdminSection {
  if (value === "all" || value === "lithuania" || value === "baltics" || value === "itf" || value === "local") return value;
  return "local";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const params = await searchParams;
  const section = parseSection(params.section);
  const tournaments = await listAdminTournaments({ section });
  const title =
    section === "lithuania"
      ? "Lithuania"
      : section === "baltics"
        ? "Baltics"
        : section === "itf"
          ? "ITF"
          : section === "all"
            ? "All tournaments"
            : "Local tournaments";

  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Select events to archive in bulk, or open Edit to change details. Unpublish hides an event without archiving it.
      </p>

      {tournaments.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No tournaments in this view.
          {section === "local" || section === "lithuania" ? (
            <>
              {" "}
              If you expected a Facebook import, open{" "}
              <Link href="/admin/facebook" className="font-semibold text-accent underline-offset-2 hover:underline">
                Facebook import
              </Link>{" "}
              and save an event again.
            </>
          ) : null}
        </p>
      ) : (
        <AdminTournamentList
          section={section}
          tournaments={tournaments.map((tournament) => ({
            id: tournament.id,
            name: tournament.name,
            city: tournament.city,
            startsOn: tournament.startsOn,
            catalogSection: tournament.catalogSection,
            sourceKind: tournament.sourceKind,
            lifecycleStatus: tournament.lifecycleStatus,
            verificationStatus: tournament.verificationStatus,
            published: tournament.published,
          }))}
        />
      )}
    </div>
  );
}
