import Link from "next/link";
import TennisBallIcon from "@/components/TennisBallIcon";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

export default function SiteFooter({ locale, messages }: { locale: Locale; messages: Messages }) {
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
