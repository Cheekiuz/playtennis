"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { track } from "@/lib/analytics";
import { switchLocalePath, type Locale } from "@/lib/i18n";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  lt: "LT",
};

export default function LocaleToggle() {
  const { locale, messages } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const otherLocale: Locale = locale === "lt" ? "en" : "lt";

  function switchTo(code: Locale) {
    const href = switchLocalePath(pathname, code);
    if (pathname === href) return;
    track("language_changed", { locale: code });
    router.push(href);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(otherLocale)}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--editorial-border)] bg-[var(--editorial-surface)] px-3 text-xs font-bold text-[var(--editorial-page-fg)] transition-colors hover:border-[var(--editorial-page-fg)]"
      aria-label={`${messages.nav.changeLanguage}: ${localeLabels[otherLocale]}`}
      title={`${messages.nav.changeLanguage}: ${localeLabels[otherLocale]}`}
    >
      {localeLabels[otherLocale]}
    </button>
  );
}
