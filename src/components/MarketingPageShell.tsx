"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { type ReactNode, type RefObject } from "react";
import AuthButton from "@/components/AuthButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { InteractiveCourtHandle } from "@/components/InteractiveCourt";

const InteractiveCourt = dynamic(() => import("@/components/InteractiveCourt"), {
  ssr: false,
  loading: () => (
    <div className="pointer-events-none fixed inset-0 z-0 bg-background" aria-hidden="true" />
  ),
});

interface MarketingPageShellProps {
  children: ReactNode;
  courtRef?: RefObject<InteractiveCourtHandle | null>;
  headerActions?: ReactNode;
  onLogoClick?: () => void;
  logoHref?: string;
  overlay?: ReactNode;
  showAuth?: boolean;
}

export default function MarketingPageShell({
  children,
  courtRef,
  headerActions,
  onLogoClick,
  logoHref = "/",
  overlay,
  showAuth = false,
}: MarketingPageShellProps) {
  const logoContent = (
    <>
      <TennisBallIcon size={22} priority />
      PlayTennis.lt
    </>
  );

  return (
    <>
      <InteractiveCourt ref={courtRef} />

      {overlay}

      <header className="pointer-events-auto relative z-30 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-transform hover:scale-105 active:scale-95"
          >
            {logoContent}
          </button>
        ) : (
          <Link
            href={logoHref}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-transform hover:scale-105 active:scale-95"
          >
            {logoContent}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {showAuth ? <AuthButton /> : null}
          {headerActions}
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pb-8">{children}</main>
    </>
  );
}
