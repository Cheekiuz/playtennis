import type { Messages } from "@/lib/i18n";
import TennisBallIcon from "@/components/TennisBallIcon";

export type Achievement = Messages["achievements"][number];

const ACHIEVEMENT_EMOJI: Record<Achievement["icon"], string> = {
  trophy: "🏆",
  tennis: "🎾",
  crown: "👑",
};

export function AchievementIcon({
  icon,
  size = 16,
}: {
  icon: Achievement["icon"];
  size?: number;
}) {
  if (icon === "tennis") {
    return <TennisBallIcon size={size} />;
  }
  return <span aria-hidden="true">{ACHIEVEMENT_EMOJI[icon]}</span>;
}
