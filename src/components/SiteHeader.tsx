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

  const tournamentsActive = pathname.startsWith(tournaments) || onHome;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e7e2] bg-[#fbfbfa]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 lg:px-12">
        <Link href={home} aria-label="PlayTennis.lt" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#111915]">
          <TennisBallIcon size={22} priority />
          <span>
            playtennis<span className="text-[#506600]">.lt</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="PlayTennis">
          <Link
            href={onHome ? "#play-next" : tournaments}
            className={navClass(tournamentsActive)}
            aria-current={tournamentsActive ? "page" : undefined}
          >
            {messages.nav.tournaments}
            {tournamentsActive ? <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-[#c8ff00]" aria-hidden="true" /> : null}
          </Link>
          <button type="button" className={navClass(false)} onClick={() => modals.open("story")}>
            {messages.nav.ourStory}
          </button>
          <button type="button" className={navClass(false)} onClick={() => modals.open("sources")}>
            {messages.nav.sources}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link
            href={saved}
            aria-label={messages.nav.saved}
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#e7e7e2] bg-white px-3 text-sm font-semibold text-[#111915]"
          >
            <HeartIcon />
            <span className="hidden sm:inline">{messages.nav.savedShort}</span>
            {savedCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#0d2818] px-1 text-center text-[11px] font-bold text-[#c8ff00]">
                {savedCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-full border border-[#e7e7e2] bg-white px-3 text-sm font-semibold text-[#111915] md:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? messages.nav.close : messages.nav.menu}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="site-menu" className="border-t border-[#e7e7e2] bg-[#fbfbfa] px-4 py-3 md:hidden" aria-label="PlayTennis">
          <ul className="grid gap-1">
            <li>
              <Link
                href={onHome ? "#play-next" : tournaments}
                className="flex min-h-11 items-center text-sm font-bold text-[#111915]"
                onClick={() => setMenuOpen(false)}
              >
                {messages.nav.tournaments}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="flex min-h-11 w-full items-center text-left text-sm font-semibold text-[#434845]"
                onClick={() => {
                  setMenuOpen(false);
                  modals.open("story");
                }}
              >
                {messages.nav.ourStory}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex min-h-11 w-full items-center text-left text-sm font-semibold text-[#434845]"
                onClick={() => {
                  setMenuOpen(false);
                  modals.open("sources");
                }}
              >
                {messages.nav.sources}
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
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
