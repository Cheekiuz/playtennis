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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const items = [
    { href: tournaments, label: messages.nav.tournaments, primary: true },
    { href: play, label: messages.nav.play, primary: false },
    { href: quiz, label: messages.nav.quiz, primary: false },
    { href: about, label: messages.nav.about, primary: false },
  ];

    const linkClass = (href: string, primary: boolean) => {
    const active = pathname === href || (href !== localePath(locale, "/") && pathname.startsWith(`${href}/`));
    const weight = active || primary ? "font-bold" : "font-semibold";
    const underline = active ? "underline decoration-4 underline-offset-4" : "";
    if (courtHome) {
      return `text-sm ${weight} ${underline} ${active || primary ? "text-[#1a1c1c] decoration-[#c1f100]" : "text-[#434845] hover:text-[#1a1c1c]"}`;
    }
    return `text-sm ${weight} ${underline} ${active ? "text-foreground decoration-accent" : "text-foreground/80 hover:text-foreground"}`;
  };

  return (
    <header className={courtHome ? "sticky top-0 z-40 border-b border-[#e2e2e2] bg-[#f9f9f8]/95 backdrop-blur" : "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur"}>
      <div className={`mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 ${courtHome ? "max-w-[1440px] lg:px-12" : "max-w-6xl sm:px-6"}`}>
        <Link href={home} aria-label="PlayTennis.lt" className={`flex items-center gap-2 text-lg font-bold tracking-tight ${courtHome ? "text-[#1a1c1c]" : "text-foreground"}`}>
          <TennisBallIcon size={22} priority />
          <span className="hidden sm:inline">
            PlayTennis{courtHome ? <span className="text-[#506600]">.lt</span> : null}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="PlayTennis">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href, item.primary)} aria-current={pathname.startsWith(item.href) ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={saved}
            aria-label={messages.nav.saved}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border ${
              courtHome ? "border-[#e2e2e2] bg-white text-[#1a1c1c]" : "border-border bg-surface text-foreground"
            }`}
          >
            <BookmarkIcon />
            {savedCount > 0 ? (
              <span className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1 text-center text-[11px] font-bold ${courtHome ? "bg-[#151d19] text-[#c1f100]" : "bg-accent text-[#0f172a]"}`}>
                {savedCount}
              </span>
            ) : null}
          </Link>
          <ThemeSwitcher paper={courtHome} />
          <LanguageSwitcher paper={courtHome} />
          <button
            type="button"
            className={`inline-flex h-11 items-center rounded-full border px-3 text-sm font-semibold lg:hidden ${
              courtHome ? "border-[#e2e2e2] bg-white text-[#1a1c1c]" : "border-border bg-surface text-foreground"
            }`}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? messages.nav.close : messages.nav.menu}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav id="site-menu" className={`border-t px-4 py-3 lg:hidden ${courtHome ? "border-[#e2e2e2] bg-[#f9f9f8]" : "border-border bg-background"}`} aria-label="PlayTennis">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`flex min-h-11 items-center ${linkClass(item.href, item.primary)}`} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
