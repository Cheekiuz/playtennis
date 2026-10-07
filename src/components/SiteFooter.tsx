import Link from "next/link";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

export default function SiteFooter({
  locale,
  messages,
  variant = "default",
}: {
  locale: Locale;
  messages: Messages;
  variant?: "default" | "editorial";
}) {
  if (variant === "editorial") {
    const links = [
      { href: localePath(locale, "/tournaments"), label: messages.nav.tournaments },
      { href: localePath(locale, "/play"), label: messages.nav.play },
      { href: localePath(locale, "/quiz"), label: messages.nav.quiz },
      { href: localePath(locale, "/about"), label: messages.nav.about },
    ];

    return (
      <footer className="border-t border-[#e2e2e2] bg-[#f9f9f8]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-12 lg:px-12">
          <div className="space-y-3 md:col-span-7">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-lg font-bold text-[#1a1c1c]">
                <TennisBallIcon size={16} />
                PlayTennis.lt
              </span>
              <span className="rounded bg-[#eeeeed] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434845]">
                {messages.home.footerIndependent}
              </span>
            </div>
            <p className="max-w-md text-[13px] leading-5 text-[#434845]">
              {messages.discover.builtBy} {messages.discover.independentBody}
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm font-semibold text-[#1a1c1c] md:col-span-5 md:items-end" aria-label="PlayTennis">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#506600]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="pointer-events-auto relative z-10 mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <TennisBallIcon size={16} />
          PlayTennis
        </span>
        <nav className="flex flex-wrap gap-4 text-sm text-foreground/80">
          <Link href={localePath(locale, "/tournaments")} className="hover:text-foreground">
            {messages.nav.tournaments}
          </Link>
          <Link href={localePath(locale, "/play")} className="hover:text-foreground">
            {messages.nav.play}
          </Link>
          <Link href={localePath(locale, "/quiz")} className="hover:text-foreground">
            {messages.nav.quiz}
          </Link>
          <Link href={localePath(locale, "/about")} className="hover:text-foreground">
            {messages.nav.about}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
