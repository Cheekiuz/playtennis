"use client";

import dynamic from "next/dynamic";

const InteractiveCourt = dynamic(() => import("@/components/InteractiveCourt"), {
  ssr: false,
});

export default function BallRain() {
  return <InteractiveCourt mode="rain" />;
}
