"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import {
  CLAY_COURT,
  HARD_COURT,
  drawRegulationCourtLines,
  fitCourtDimensions,
} from "@/lib/court-draw";
import { playRacketSound } from "@/lib/court-sound";
import type { Messages } from "@/lib/i18n";

type Surface = "clay" | "hard" | "grass";

const WINDOWS: Record<Surface, number> = { clay: 0.16, hard: 0.1, grass: 0.07 };
const BEST_KEY = "playtennis.rally.best";
const bestListeners = new Set<() => void>();

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function readBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day?: string; score?: number };
    if (parsed.day === todayStamp() && typeof parsed.score === "number") return parsed.score;
    return 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number) {
  const next = Math.max(readBest(), score);
  window.localStorage.setItem(BEST_KEY, JSON.stringify({ day: todayStamp(), score: next }));
  for (const listener of bestListeners) listener();
}

function subscribeBest(listener: () => void) {
  bestListeners.add(listener);
  return () => bestListeners.delete(listener);
}

export default function RallyGame({ messages, findHref }: { messages: Messages; findHref: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [surface, setSurface] = useState<Surface>("clay");
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [score, setScore] = useState(0);
  const best = useSyncExternalStore(subscribeBest, readBest, () => 0);
  const [line, setLine] = useState("");
  const [sound, setSound] = useState(true);
  const stateRef = useRef({ phase: "ready" as "ready" | "play" | "over", score: 0, surface: "clay" as Surface, sound: true });

  useEffect(() => {
    stateRef.current.surface = surface;
    stateRef.current.sound = sound;
    stateRef.current.phase = phase;
    stateRef.current.score = score;
  }, [surface, sound, phase, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let progress = 0;
    let running = phase === "play";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const { courtW, courtH } = fitCourtDimensions(width, height, 0.72);
      const colors = stateRef.current.surface === "clay" ? CLAY_COURT : stateRef.current.surface === "grass"
        ? { surface: "#2f6b32", surfaceDark: "#245428", line: "#f4f7ef", outer: "#1c3d22" }
        : HARD_COURT;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.fillStyle = colors.outer;
      ctx.fillRect(-courtW / 2 - 18, -courtH / 2 - 18, courtW + 36, courtH + 36);
      ctx.fillStyle = colors.surface;
      ctx.fillRect(-courtW / 2, -courtH / 2, courtW, courtH);
      drawRegulationCourtLines(ctx, courtW, courtH, {
        lineColor: colors.line,
        chalk: stateRef.current.surface === "clay",
      });

      const ballY = -courtH / 2 + progress * courtH;
      ctx.beginPath();
      ctx.fillStyle = "#d6e22a";
      ctx.arc(0, ballY, 10 + progress * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      if (running) {
        const speed = reduced ? 0.28 : 0.55 + Math.min(stateRef.current.score, 12) * 0.035;
        progress += speed / 60;
        if (progress > 1) {
          running = false;
          finish(false);
        }
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const finish = (hit: boolean) => {
      if (!hit) {
        const finalScore = stateRef.current.score;
        const lines = Object.values(messages.play.lines);
        setLine(lines[finalScore % lines.length] ?? lines[0]);
        setPhase("over");
        stateRef.current.phase = "over";
        writeBest(finalScore);
        track("rally_finished", { score: finalScore, surface: stateRef.current.surface });
      }
    };

    const swing = () => {
      if (stateRef.current.phase !== "play" || !running) return;
      const windowSize = WINDOWS[stateRef.current.surface];
      const sweet = 0.86;
      if (progress >= sweet - windowSize && progress <= sweet + windowSize / 2) {
        if (stateRef.current.sound) playRacketSound(0.08);
        progress = 0.08;
        setScore((value) => {
          stateRef.current.score = value + 1;
          return value + 1;
        });
        return;
      }
      running = false;
      finish(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      swing();
    };

    draw();
    frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", swing);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", swing);
    };
  }, [phase, messages.play.lines]);

  const rankKey = score < 4 ? "0" : score < 8 ? "1" : score < 14 ? "2" : "3";
  const suggestion = score < 5 ? "when=this-weekend" : score < 12 ? "surface=clay" : "audience=masters";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {messages.play.score}: {score}
          <span className="ml-4 text-foreground/70">
            {messages.play.best}: {best}
          </span>
        </p>
        <button type="button" className="text-sm font-semibold underline-offset-2 hover:underline" onClick={() => setSound((value) => !value)}>
          {sound ? messages.play.soundOn : messages.play.soundOff}
        </button>
      </div>

      <canvas ref={canvasRef} className="h-[68vh] min-h-80 w-full border border-border bg-background" />

      {phase !== "play" ? (
        <div className="flex flex-wrap items-center gap-3">
          {(["clay", "hard", "grass"] as Surface[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSurface(option)}
              className={`border px-3 py-1.5 text-sm font-semibold ${surface === option ? "border-accent text-accent" : "border-border"}`}
            >
              {messages.play[option]}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn-primary w-fit rounded-full px-5 py-2 text-sm font-semibold" onClick={() => canvasRef.current?.dispatchEvent(new PointerEvent("pointerdown"))}>
          {messages.play.hit}
        </button>
      )}

      {phase === "ready" ? (
        <button type="button" className="btn-primary w-fit rounded-full px-5 py-2 text-sm font-semibold" onClick={() => start()}>
          {messages.play.start}
        </button>
      ) : null}

      {phase === "over" ? (
        <div className="grid gap-2">
          <p className="text-xl font-bold">{messages.play.ranks[rankKey]}</p>
          <p className="text-sm text-foreground/80">{line}</p>
          <div className="flex flex-wrap gap-4">
            <button type="button" className="text-sm font-semibold text-accent hover:underline" onClick={() => start()}>
              {messages.play.again}
            </button>
            <a className="text-sm font-semibold text-accent hover:underline" href={`${findHref}?${suggestion}`}>
              {messages.play.find}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );

  function start() {
    setScore(0);
    setLine("");
    setPhase("play");
    track("rally_started", { surface });
  }
}
