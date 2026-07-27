"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardAlertsPanel from "@/components/DashboardAlertsPanel";
import MarketingPageShell from "@/components/MarketingPageShell";
import TennisBallIcon from "@/components/TennisBallIcon";
import { useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { localePath } from "@/lib/i18n";
import type { CourtAlert } from "@/lib/court-alerts-types";

export default function DashboardPageClient() {
  const { locale, messages: m } = useLocale();
  const { user } = useAuth();
  const dash = m.dashboard;
  const [editingAlert, setEditingAlert] = useState<CourtAlert | null>(null);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "";

  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <MarketingPageShell showAuth>
        <section className="w-full max-w-3xl pt-4">
          <div className="glass-card card-glow rounded-3xl border border-border bg-card/95 p-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
                  <TennisBallIcon size={28} />
                </div>
              )}
              <div>
                <p className="text-sm text-muted">{dash.welcome}</p>
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted">{user?.email}</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted">{dash.description}</p>

            <Link
              href={localePath(locale, "/court-alerts")}
              className="btn-glow btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <TennisBallIcon size={20} variant="cta" />
              {dash.createAlert}
            </Link>
          </div>
        </section>

        <section className="mt-8 w-full max-w-3xl">
          <DashboardAlertsPanel
            onEditAlert={(alert) => {
              setEditingAlert(alert);
              window.location.href = `${localePath(locale, "/court-alerts")}?edit=${alert.id}`;
            }}
          />
        </section>

        {editingAlert && null}
      </MarketingPageShell>
    </div>
  );
}
