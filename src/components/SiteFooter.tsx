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
  const paper = variant === "editorial";
  const links = [
    { href: localePath(locale, "/tournaments"), label: messages.nav.tournaments },
    { href: localePath(locale, "/quiz"), label: messages.nav.quiz },
    { href: localePath(locale, "/submit"), label: messages.nav.submit },
    { href: localePath(locale, "/about"), label: messages.nav.about },
    { href: `${localePath(locale, "/about")}#contact`, label: messages.footer.contact },
  ];

  return (
    <footer className={paper ? "border-t border-[#e2e2e2] bg-[#f9f9f8] text-[#1a1c1c]" : "mt-16 border-t border-border text-foreground"}>
      <div className={`mx-auto flex w-full flex-col gap-6 px-4 py-8 sm:px-6 ${paper ? "max-w-[1440px] lg:px-12" : "max-w-6xl"}`}>
        <div className="space-y-2">
          <span className="flex items-center gap-2 text-base font-bold">
            <TennisBallIcon size={16} />
            PlayTennis.lt
          </span>
          <p className={`max-w-md text-sm leading-6 ${paper ? "text-[#434845]" : "text-foreground/75"}`}>{messages.discover.builtBy}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold" aria-label="PlayTennis">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={paper ? "hover:text-[#506600]" : "hover:text-accent"}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
