"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";

export default function RotatingMessage() {
  const { messages: m } = useLocale();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % m.messages.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, [m.messages.length]);

  return (
    <p
      className={`mt-8 min-h-[3rem] max-w-lg text-sm italic text-foreground/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)] dark:[text-shadow:0_1px_10px_rgba(0,0,0,0.55)] transition-all duration-400 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {m.messages[index]}
    </p>
  );
}
