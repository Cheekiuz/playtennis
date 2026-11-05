"use client";

import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";

function SunIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function ThemeSwitcher({
  paper = false,
  compact = false,
}: {
  paper?: boolean;
  /** Smaller control for footer and tight layouts */
  compact?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const { messages: m } = useLocale();

  const nextTheme = theme === "dark" ? m.theme.light : m.theme.dark;

  const sizeClass = compact ? "h-8 w-8" : "h-9 w-9";
  const iconClass = compact ? "h-[15px] w-[15px]" : "h-4 w-4";
  const paperClass = compact
    ? "border-[#e7e7e2] text-[#434845] hover:border-[#111915] hover:text-[#111915]"
    : "border-[#e2e2e2] text-[#1a1c1c] hover:border-[#111915]";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${m.theme.change}: ${nextTheme}`}
      title={`${m.theme.change}: ${nextTheme}`}
      className={
        paper
          ? `flex ${sizeClass} shrink-0 items-center justify-center rounded-full border bg-[var(--editorial-surface)] transition-colors ${paperClass}`
          : `flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground`
      }
    >
      {theme === "dark" ? <MoonIcon className={iconClass} /> : <SunIcon className={iconClass} />}
    </button>
  );
}
