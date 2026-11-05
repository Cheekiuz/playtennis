"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LocaleToggle from "@/components/LocaleToggle";
import { useSiteModals } from "@/components/SiteModals";
import TennisBallIcon from "@/components/TennisBallIcon";
import { useLocale } from "@/context/LocaleContext";
import { localePath } from "@/lib/i18n";
import { readSavedIds } from "@/lib/tournaments/saved";

export default function SiteHeader() {
  const { locale, messages } = useLocale();
  const pathname = usePathname();
  const modals = useSiteModals();
  const [savedCount, setSavedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = localePath(locale, "/");
  const tournaments = localePath(locale, "/tournaments");
  const saved = localePath(locale, "/saved");
  const onHome = pathname === home || pathname === `${home}/`;

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tournamentsActive = pathname.startsWith(tournaments) || onHome;

  const shellClass = scrolled
    ? "max-md:px-0 max-md:pt-0 px-3 pt-0.5 sm:px-4 lg:px-3 xl:px-4 2xl:px-6"
    : "px-0 pt-0";
  const barSizeClass = scrolled
    ? "max-md:max-w-none max-w-[min(100%,1680px)]"
    : "max-w-none md:max-w-[1440px]";
  const barClass = scrolled
    ? "border-[var(--editorial-border)] bg-[var(--editorial-header-bg-scrolled)] backdrop-blur-lg max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:shadow-none md:rounded-2xl md:border md:shadow-[var(--editorial-header-shadow)]"
    : "rounded-none border-b border-[var(--editorial-border)] bg-[var(--editorial-header-bg)] backdrop-blur-lg";
  const rowClass = scrolled ? "px-3 sm:px-4 lg:px-10 xl:px-12" : "px-3 sm:px-4 lg:px-12";

  return (
    <div className={`sticky top-0 z-40 w-full transition-[padding] duration-300 ease-out ${shellClass}`}>
      <header className={`mx-auto w-full overflow-hidden transition-all duration-300 ease-out ${barSizeClass} ${barClass}`}>
        <div
          className={`mx-auto flex h-14 w-full min-w-0 items-center gap-2 transition-[padding] duration-300 ease-out sm:h-16 sm:gap-4 md:gap-8 lg:gap-12 ${rowClass}`}
        >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2 md:flex-none md:gap-3">
          <Link
            href={home}
            aria-label="PlayTennis.lt"
            className="flex min-w-0 shrink items-center gap-1.5 text-base font-bold tracking-tight text-[var(--editorial-page-fg)] sm:gap-2 sm:text-lg"
          >
            <TennisBallIcon size={22} priority />
            <span className="truncate">
              playtennis<span className="text-[#506600]">.lt</span>
            </span>
          </Link>
          <span className="hidden truncate text-[11px] font-bold uppercase tracking-[0.08em] text-red-600 min-[420px]:inline sm:text-xs">
            Under construction
          </span>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-10 md:flex lg:gap-12" aria-label="PlayTennis">
          <Link
            href={onHome ? "#play-next" : tournaments}
            className={`relative inline-flex items-center ${navClass(tournamentsActive)}`}
            aria-current={tournamentsActive ? "page" : undefined}
          >
            {messages.nav.tournaments}
            {tournamentsActive ? (
              <span
                className="pointer-events-none absolute left-1/2 top-full mt-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c8ff00]"
                aria-hidden="true"
              />
            ) : null}
          </Link>
          <button type="button" className={`inline-flex items-center ${navClass(false)}`} onClick={() => modals.open("story")}>
            {messages.nav.ourStory}
          </button>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleToggle />
          <Link
            href={saved}
            aria-label={messages.nav.saved}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--editorial-border)] bg-[var(--editorial-surface)] text-[var(--editorial-page-fg)] sm:h-11 sm:w-11"
          >
            <HeartIcon />
            {savedCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#0d2818] px-1 text-center text-[11px] font-bold text-[#c8ff00]">
                {savedCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--editorial-border)] bg-[var(--editorial-surface)] text-[var(--editorial-page-fg)] md:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? messages.nav.close : messages.nav.menu}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
        </div>

        {menuOpen ? (
        <nav id="site-menu" className="border-t border-[var(--editorial-border)] bg-[var(--editorial-header-bg-scrolled)] px-4 py-3 backdrop-blur-md md:hidden" aria-label="PlayTennis">
          <ul className="grid gap-1">
            <li>
              <Link
                href={onHome ? "#play-next" : tournaments}
                className="flex min-h-11 items-center text-sm font-bold text-[var(--editorial-page-fg)]"
                onClick={() => setMenuOpen(false)}
              >
                {messages.nav.tournaments}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="flex min-h-11 w-full items-center text-left text-sm font-semibold text-[var(--editorial-muted)]"
                onClick={() => {
                  setMenuOpen(false);
                  modals.open("story");
                }}
              >
                {messages.nav.ourStory}
              </button>
            </li>
          </ul>
        </nav>
        ) : null}
      </header>
    </div>
  );
}

function navClass(active: boolean) {
  return active
    ? "text-sm font-bold text-[#111915]"
    : "text-sm font-semibold text-[#434845] hover:text-[#111915]";
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
