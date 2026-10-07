"use client";

import { useEffect } from "react";
import { triggerCourtBurst } from "@/lib/court-controls";

export default function CourtHotkeys() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyT" && event.key.toLowerCase() !== "t") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      triggerCourtBurst();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return null;
}
