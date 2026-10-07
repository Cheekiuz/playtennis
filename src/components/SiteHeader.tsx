"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLocale } from "@/context/LocaleContext";
import { triggerCourtRain } from "@/lib/court-controls";
import { localePath } from "@/lib/i18n";
import { readSavedIds } from "@/lib/tournaments/saved";

export default function SiteHeader({ courtHome = false }: { courtHome?: boolean }) {
  const { locale, messages } = useLocale();
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);
  const home = localePath(locale, "/");
  const tournaments = localePath(locale, "/tournaments");
  const play = localePath(locale, "/play");
  const quiz = localePath(locale, "/quiz");
  const about = localePath(locale, "/about");
  const saved = localePath(locale, "/saved");

  useEffect(() => {
    const sync = () => setSavedCount(readSavedIds().length);
    sync();
    window.addEventListener("playtennis-saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("playtennis-saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const linkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `text-sm font-semibold ${active ? "text-accent" : "text-foreground/80 hover:text-foreground"}`;
  };

  if (courtHome) {
    const soon = (label: string) => (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#434845]">
        {label}
        <span className="rounded border border-[#e2e2e2] bg-[#eeeeed] px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider">
          {messages.nav.soon}
        </span>
      </span>
    );

    return (
      <header className="sticky top-0 z-40 border-b border-[#e2e2e2] bg-[#f9f9f8]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-12">
          <div className="flex items-center gap-4">
            <Link href={home} className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#1a1c1c]">
              <TennisBallIcon size={22} priority />
              <span className="hidden sm:inline">
                PlayTennis<span className="text-[#506600]">.lt</span>
              </span>
            </Link>
            <span className="hidden items-center gap-1.5 rounded border border-[#e2e2e2] bg-[#eeeeed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434845] md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#506600]" />
              {messages.home.footerIndependent}
            </span>
          </div>
          <nav className="hidden items-center gap-6 xl:flex" aria-label="PlayTennis">
            <Link href={tournaments} className="border-b-2 border-[#111915] pb-0.5 text-sm font-bold text-[#1a1c1c]">
              {messages.nav.tournaments}
            </Link>
            {soon(messages.nav.courts)}
            {soon(messages.nav.coaches)}
            {soon(messages.nav.clubs)}
            <a href="#why" className="text-xs font-semibold text-[#434845] hover:text-[#1a1c1c]">
              {messages.nav.philosophy}
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              data-rain-control="header"
              onClick={() => {
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                triggerCourtRain();
              }}
              className="hidden items-center gap-1.5 rounded border border-[#e2e2e2] bg-[#f3f4f3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#434845] lg:inline-flex"
            >
              <span aria-hidden="true">🎾</span>
              <span>
                {messages.tip.press}{" "}
                <kbd className="rounded border border-[#c3c8c3] bg-white px-1 text-[10px] font-bold normal-case tracking-normal text-[#1a1c1c]">
                  T
                </kbd>{" "}
                {messages.tip.ballStorm}
              </span>
            </button>
            <Link
              href={tournaments}
              className="inline-flex items-center gap-2 rounded-full bg-[#151d19] px-3.5 py-2 text-xs font-semibold text-white hover:bg-black"
            >
              <span className="h-2 w-2 rounded-full bg-[#c1f100]" />
              <span className="whitespace-nowrap">{messages.home.findTournament}</span>
            </Link>
            <Link
              href={saved}
              aria-label={messages.nav.saved}
              className="relative hidden h-9 items-center rounded-full border border-[#e2e2e2] bg-white px-3 text-sm font-semibold text-[#1a1c1c] hover:border-[#111915] sm:flex"
            >
              {messages.discover.saved}
              {savedCount > 0 ? <span className="ml-2 text-[#506600]">{savedCount}</span> : null}
            </Link>
            <ThemeSwitcher paper />
            <LanguageSwitcher paper />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="pointer-events-auto relative z-30 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
      <div className="flex items-center gap-6">
        <Link href={home} className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <TennisBallIcon size={22} priority />
          PlayTennis
        </Link>
        <nav className="flex flex-wrap items-center gap-3 sm:gap-4" aria-label="PlayTennis">
          <Link href={tournaments} className={linkClass(tournaments)} aria-current={pathname.startsWith(tournaments) ? "page" : undefined}>
            {messages.nav.tournaments}
          </Link>
          <Link href={play} className={linkClass(play)} aria-current={pathname.startsWith(play) ? "page" : undefined}>
            {messages.nav.play}
          </Link>
          <Link href={quiz} className={linkClass(quiz)} aria-current={pathname.startsWith(quiz) ? "page" : undefined}>
            {messages.nav.quiz}
          </Link>
          <Link href={about} className={linkClass(about)} aria-current={pathname === about ? "page" : undefined}>
            {messages.nav.about}
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={saved}
          aria-label={messages.nav.saved}
          className="relative flex h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground/80 hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {messages.discover.saved}
          {savedCount > 0 ? <span className="ml-2 text-accent">{savedCount}</span> : null}
        </Link>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
