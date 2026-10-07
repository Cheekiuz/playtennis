"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLocale } from "@/context/LocaleContext";
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

  return (
    <header className={`pointer-events-auto relative z-30 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 ${courtHome ? "" : ""}`}>
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
