import { BALL_IMAGE_SRC } from "@/lib/tennis-ball-assets";

interface TennisBallIconProps {
  className?: string;
  size?: number;
  priority?: boolean;
  variant?: "default" | "cta";
}

export default function TennisBallIcon({
  className = "",
  size = 18,
  priority = false,
  variant = "default",
}: TennisBallIconProps) {
  const isCta = variant === "cta";
  const srcSize = isCta ? size * 2 : size;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BALL_IMAGE_SRC}
      alt=""
      width={srcSize}
      height={srcSize}
      style={{ width: size, height: size }}
      className={`tennis-ball-icon${isCta ? " tennis-ball-icon--cta" : ""} ${className}`.trim()}
      aria-hidden="true"
      draggable={false}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
