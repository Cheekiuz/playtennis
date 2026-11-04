import Link from "next/link";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

const FOOTER_LINKS: { path: string; label: (m: Messages) => string }[] = [
  { path: "/tournaments", label: (m) => m.nav.tournaments },
  { path: "/lithuania", label: (m) => m.nav.lithuania },
  { path: "/baltics", label: (m) => m.nav.baltics },
  { path: "/itf", label: (m) => m.nav.itf },
  { path: "/about", label: (m) => m.nav.about },
];

export default function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="border-t border-[#e7e7e2] bg-[#fbfbfa] text-[#111915]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-12">
        <div className="space-y-2">
          <span className="flex items-center gap-2 text-base font-bold">
            <TennisBallIcon size={16} />
            playtennis.lt
          </span>
          <p className="max-w-md text-sm leading-6 text-[#747874]">{messages.discover.builtBy}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#747874]">
          <span>{messages.footer.tagline}</span>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.path} href={localePath(locale, link.path)} className="hover:text-[#111915] hover:underline">
              {link.label(messages)}
            </Link>
          ))}
          <Link href={localePath(locale, "/submit")} className="font-semibold text-[#111915] hover:underline">
            {messages.nav.submit}
          </Link>
        </div>
      </div>
    </footer>
  );
}
