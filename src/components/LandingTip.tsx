import TennisBallIcon from "@/components/TennisBallIcon";
import type { Messages } from "@/lib/i18n";

interface LandingTipProps {
  messages: Messages;
}

export default function LandingTip({ messages: m }: LandingTipProps) {
  return (
    <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 backdrop-blur-sm">
      <span className="font-mono text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
        ⌨
      </span>
      <span className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
        {m.tip.press}{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-foreground">
          T
        </kbd>{" "}
        {m.tip.ballStorm}{" "}
        <TennisBallIcon size={14} />
        · {m.tip.clayMode}
      </span>
    </div>
  );
}
