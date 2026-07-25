import TennisBallIcon from "@/components/TennisBallIcon";
import type { Messages } from "@/lib/i18n";

interface LandingFooterProps {
  messages: Messages;
}

export default function LandingFooter({ messages: m }: LandingFooterProps) {
  return (
    <footer className="pointer-events-auto relative z-10 mt-10 sm:mt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-3 sm:flex-row">
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <TennisBallIcon size={16} />
          PlayTennis.lt
        </span>
        <p className="text-xs text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
          {m.footer.madeWith}
        </p>
      </div>
    </footer>
  );
}
