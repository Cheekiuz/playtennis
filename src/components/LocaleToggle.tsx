"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { track } from "@/lib/analytics";
import { switchLocalePath, type Locale } from "@/lib/i18n";

export default function LocaleToggle() {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(code: Locale) {
    const href = switchLocalePath(pathname, code);
    if (pathname === href) return;
    track("language_changed", { locale: code });
    router.push(href);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full border border-[#e7e7e2] bg-white p-0.5 text-xs font-bold">
      <button
        type="button"
        onClick={() => switchTo("lt")}
        className={
          locale === "lt"
            ? "rounded-full bg-[#111915] px-2.5 py-1.5 text-[#c8ff00]"
            : "rounded-full px-2.5 py-1.5 text-[#747874] hover:text-[#111915]"
        }
        aria-pressed={locale === "lt"}
      >
        LT
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={
          locale === "en"
            ? "rounded-full bg-[#111915] px-2.5 py-1.5 text-[#c8ff00]"
            : "rounded-full px-2.5 py-1.5 text-[#747874] hover:text-[#111915]"
        }
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
