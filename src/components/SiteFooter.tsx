import Link from "next/link";
import TennisBallIcon from "@/components/TennisBallIcon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

const FOOTER_LINKS: { path: string; label: (m: Messages) => string }[] = [
  { path: "/tournaments", label: (m) => m.nav.tournaments },
  { path: "/lithuania", label: (m) => m.nav.lithuania },
  { path: "/baltics", label: (m) => m.nav.baltics },
  { path: "/itf", label: (m) => m.nav.itf },
  { path: "/about", label: (m) => m.nav.about },
];

const linkClass =
  "text-[var(--editorial-muted)] transition-colors hover:text-[var(--editorial-page-fg)] hover:underline";

export default function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="border-t border-[var(--editorial-border)] bg-[var(--editorial-page-bg)] text-[var(--editorial-page-fg)] transition-colors duration-250">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex min-w-0 items-start justify-between gap-4 lg:block lg:max-w-sm">
            <div className="min-w-0 space-y-2">
              <span className="flex items-center gap-2 text-base font-bold tracking-tight">
                <TennisBallIcon size={16} />
                playtennis.lt
              </span>
              <p className="text-sm leading-6 text-[var(--editorial-muted)]">{messages.discover.builtBy}</p>
            </div>
            <ThemeSwitcher paper compact />
          </div>

          <div className="min-w-0 flex-1 border-t border-[var(--editorial-border)] pt-6 lg:border-t-0 lg:pt-0">
            <p className="text-sm leading-6 text-[var(--editorial-muted)]">{messages.footer.tagline}</p>
            <nav
              className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 md:flex md:flex-wrap md:gap-x-6 md:gap-y-2"
              aria-label="Footer"
            >
              {FOOTER_LINKS.map((link) => (
                <Link key={link.path} href={localePath(locale, link.path)} className={linkClass}>
                  {link.label(messages)}
                </Link>
              ))}
              <Link
                href={localePath(locale, "/submit")}
                className="col-span-2 font-semibold text-[var(--editorial-page-fg)] hover:underline max-sm:pt-1 sm:col-span-1"
              >
                {messages.nav.submit}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
