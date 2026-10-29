"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function HeroRandomBall({
  hrefs,
  label,
  children,
}: {
  hrefs: string[];
  label: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function onClick() {
    if (hrefs.length === 0) {
      document.getElementById("play-next")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(hrefs[Math.floor(Math.random() * hrefs.length)]!);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative z-10 cursor-pointer rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8ff00] active:scale-95"
    >
      {children}
    </button>
  );
}
