"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { localePath } from "@/lib/i18n";

export default function AuthButton() {
  const { locale, messages: m } = useLocale();
  const { user, loading, isConfigured } = useAuth();
  const auth = m.auth;

  if (!isConfigured) return null;

  const dashboardPath = localePath(locale, "/dashboard");
  const loginPath = `/auth/login?next=${encodeURIComponent(dashboardPath)}`;
  const logoutPath = `/auth/logout?next=${encodeURIComponent(localePath(locale, "/"))}`;

  if (loading) {
    return (
      <span className="hidden text-sm text-muted sm:inline" aria-hidden="true">
        …
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={dashboardPath}
          className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover sm:inline"
        >
          {auth.dashboard}
        </Link>
        <a
          href={logoutPath}
          className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline"
        >
          {auth.signOut}
        </a>
      </div>
    );
  }

  return (
    <a
      href={loginPath}
      className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover sm:inline"
    >
      {auth.signIn}
    </a>
  );
}
