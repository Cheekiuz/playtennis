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

  return (
    <div>
      <h1 className="text-3xl font-bold">Tournaments</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Select events to archive in bulk, or open Edit to change details. Unpublish hides an event without archiving it.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
        <SectionLink href="/admin?section=local" active={section === "local"}>
          Local (LT + Baltics)
        </SectionLink>
        <SectionLink href="/admin?section=lithuania" active={section === "lithuania"}>
          Lithuania
        </SectionLink>
        <SectionLink href="/admin?section=baltics" active={section === "baltics"}>
          Baltics
        </SectionLink>
        <SectionLink href="/admin?section=itf" active={section === "itf"}>
          ITF
        </SectionLink>
        <SectionLink href="/admin?section=all" active={section === "all"}>
          All
        </SectionLink>
      </div>

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

function SectionLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-accent px-3 py-1.5 text-[#0f172a]"
          : "rounded-full border border-border px-3 py-1.5 text-foreground/80 hover:border-accent"
      }
    >
      {children}
    </Link>
  );
}
