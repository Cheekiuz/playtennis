"use client";

import { track } from "@/lib/analytics";

export default function OutboundLink({
  href,
  children,
  event,
  tournamentId,
  className,
}: {
  href: string;
  children: React.ReactNode;
  event: "registration_click" | "official_click";
  tournamentId: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => track(event, { tournament_id: tournamentId })}
    >
      {children}
    </a>
  );
}
