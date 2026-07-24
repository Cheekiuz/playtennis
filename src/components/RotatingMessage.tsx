"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Looking for someone who actually replies 'Let's play tomorrow.'",
  "Teaching AI to call balls IN and OUT.",
  "Stretching the virtual tennis net...",
  "Warming up the servers...",
  "Inflating tennis balls...",
  "Waiting for perfect weather...",
  "Finding doubles partners who never cancel...",
];

export default function RotatingMessage() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className={`mt-8 min-h-[3rem] max-w-lg text-sm italic text-slate-400 transition-all duration-400 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {MESSAGES[index]}
    </p>
  );
}
