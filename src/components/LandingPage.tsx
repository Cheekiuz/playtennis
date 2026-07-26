import AnimatedStats from "@/components/AnimatedStats";
import LandingFooter from "@/components/LandingFooter";
import LandingHero from "@/components/LandingHero";
import LandingPageClient from "@/components/LandingPageClient";
import LandingTip from "@/components/LandingTip";
import type { Messages } from "@/lib/i18n";

interface LandingPageProps {
  messages: Messages;
}

export default function LandingPage({ messages }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <LandingPageClient
        messages={messages}
        hero={<LandingHero messages={messages} />}
        stats={<AnimatedStats tagline={messages.stats.tagline} />}
        tip={<LandingTip messages={messages} />}
        footer={<LandingFooter messages={messages} />}
      />
    </div>
  );
}
