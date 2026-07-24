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
      className={`mt-8 min-h-[3rem] max-w-lg text-sm italic text-muted transition-all duration-400 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {m.messages[index]}
    </p>
  );
}
