"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/context/LocaleContext";

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function RotatingMessage() {
  const { messages: m } = useLocale();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % m.messages.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, [m.messages.length, reducedMotion]);

  return (
    <p
      className={`mt-8 min-h-[3rem] max-w-lg text-sm italic text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)] ${
        reducedMotion ? "" : "transition-all duration-400"
      } ${visible || reducedMotion ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
    >
      {m.messages[index]}
    </p>
  );
}
