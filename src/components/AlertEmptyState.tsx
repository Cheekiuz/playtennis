"use client";

import { useLocale } from "@/context/LocaleContext";
import EyeWatchingIllustration from "@/components/EyeWatchingIllustration";
import TennisBallIcon from "@/components/TennisBallIcon";

interface AlertEmptyStateProps {
  onCreateClick?: () => void;
}

export default function AlertEmptyState({ onCreateClick }: AlertEmptyStateProps) {
  const { messages: m } = useLocale();
  const ca = m.courtAlerts.empty;

  const handleClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      document.getElementById("create-alert")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <EyeWatchingIllustration />
      <h3 className="mt-6 text-lg font-semibold text-foreground">{ca.title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{ca.subtitle}</p>
      <button
        type="button"
        onClick={handleClick}
        className="btn-glow btn-primary mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
      >
        <TennisBallIcon size={18} variant="cta" />
        {ca.cta}
      </button>
    </div>
  );
}
