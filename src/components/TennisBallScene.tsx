"use client";

import { useCallback, useEffect, useState } from "react";

interface Ball {
  id: number;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  blur: number;
  delay: number;
  floating?: boolean;
  top?: string;
  left?: string;
}

let ballId = 0;

function TennisBall({
  size,
  blur,
  className,
  style,
}: {
  size: number;
  blur: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`tennis-ball relative rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        filter: `blur(${blur}px)`,
        ...style,
      }}
    />
  );
}

export default function TennisBallScene() {
  const [balls, setBalls] = useState<Ball[]>([
    {
      id: ballId++,
      size: 72,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      blur: 1,
      delay: 0,
      floating: true,
      top: "28%",
      left: "8%",
    },
    {
      id: ballId++,
      size: 48,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      blur: 2,
      delay: 1.5,
      floating: true,
      top: "52%",
      left: "5%",
    },
  ]);

  const launchBall = useCallback(() => {
    const startX = Math.random() * window.innerWidth * 0.3;
    const startY = window.innerHeight * 0.6 + Math.random() * 200;
    const endX = startX + 200 + Math.random() * 400;
    const endY = startY - 300 - Math.random() * 400;
    const id = ballId++;

    setBalls((prev) => [
      ...prev,
      {
        id,
        size: 32 + Math.random() * 24,
        startX,
        startY,
        endX,
        endY,
        blur: 0,
        delay: 0,
      },
    ]);

    window.setTimeout(() => {
      setBalls((prev) => prev.filter((ball) => ball.id !== id));
    }, 2500);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        launchBall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [launchBall]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {balls.map((ball) =>
        ball.floating ? (
          <TennisBall
            key={ball.id}
            size={ball.size}
            blur={ball.blur}
            className="ball-float absolute opacity-80"
            style={{
              top: ball.top,
              left: ball.left,
              animationDelay: `${ball.delay}s`,
            }}
          />
        ) : (
          <TennisBall
            key={ball.id}
            size={ball.size}
            blur={ball.blur}
            className="ball-launch absolute z-10"
            style={
              {
                top: ball.startY,
                left: ball.startX,
                "--start-x": "0px",
                "--start-y": "0px",
                "--end-x": `${ball.endX - ball.startX}px`,
                "--end-y": `${ball.endY - ball.startY}px`,
              } as React.CSSProperties
            }
          />
        ),
      )}
    </div>
  );
}
