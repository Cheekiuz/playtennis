"use client";

import { useEffect } from "react";
import { preloadTennisBallImage } from "@/lib/tennis-ball-draw";

export default function TennisBallPreload() {
  useEffect(() => {
    preloadTennisBallImage().catch(() => {});
  }, []);

  return null;
}
