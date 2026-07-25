"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { playRacketSound } from "@/lib/court-sound";
import {
  CLAY_COURT,
  COURT_BLUR_PX,
  drawClayTexture,
  drawRegulationCourtLines,
  fitCourtDimensions,
  HARD_COURT,
} from "@/lib/court-draw";
import { drawTennisBall, type BallExpression } from "@/lib/tennis-ball-draw";

export interface InteractiveCourtHandle {
  triggerRain: () => void;
  triggerBurst: () => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  expression: BallExpression;
  floating: boolean;
  floatPhase: number;
  opacity: number;
  blur: number;
  rotation: number;
  spin: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface CanvasColors {
  bg: string;
  glow: string;
}

interface CourtCache {
  canvas: HTMLCanvasElement | null;
  w: number;
  h: number;
  clayBlend: number;
}

const GRAVITY = 680;
const BOUNCE = 0.72;
const FRICTION = 0.992;
const MAX_BALLS = 28;
const CLAY_BLEND_CACHE_STEP = 0.02;
const RESIZE_DEBOUNCE_MS = 120;

let nextBallId = 1;

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function readCanvasColors(): CanvasColors {
  return {
    bg: readCssVar("--canvas-bg", "#050a14"),
    glow: readCssVar("--canvas-glow", "rgba(200,255,0,0.04)"),
  };
}

function quantizeClayBlend(blend: number) {
  return Math.round(blend / CLAY_BLEND_CACHE_STEP) * CLAY_BLEND_CACHE_STEP;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createBall(
  x: number,
  y: number,
  vx: number,
  vy: number,
  opts: Partial<Ball> = {},
): Ball {
  const radius = opts.radius ?? 14 + Math.random() * 8;
  return {
    id: nextBallId++,
    x,
    y,
    vx,
    vy,
    radius,
    mass: radius * radius,
    expression: opts.expression ?? "normal",
    floating: opts.floating ?? false,
    floatPhase: Math.random() * Math.PI * 2,
    opacity: opts.opacity ?? 1,
    blur: opts.blur ?? 0,
    rotation: 0,
    spin: (Math.random() - 0.5) * 8,
    ...opts,
  };
}

function resolveCollision(a: Ball, b: Ball) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.radius + b.radius;
  if (dist === 0 || dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const totalMass = a.mass + b.mass;

  a.x -= (nx * overlap * b.mass) / totalMass;
  a.y -= (ny * overlap * b.mass) / totalMass;
  b.x += (nx * overlap * a.mass) / totalMass;
  b.y += (ny * overlap * a.mass) / totalMass;

  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const impact = dvx * nx + dvy * ny;
  if (impact <= 0) return;

  const impulse = (2 * impact) / totalMass;
  a.vx -= impulse * b.mass * nx;
  a.vy -= impulse * b.mass * ny;
  b.vx += impulse * a.mass * nx;
  b.vy += impulse * a.mass * ny;
}

function spawnParticles(particles: Particle[], x: number, y: number, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      size: 1.5 + Math.random() * 2.5,
    });
  }
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  drawTennisBall(ctx, ball.x, ball.y, ball.radius, {
    rotation: ball.rotation,
    opacity: ball.opacity,
    blur: ball.blur,
    expression: ball.expression,
    showShadow: !ball.floating && ball.opacity > 0.5,
  });
}

function drawCourt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tiltX: number,
  tiltY: number,
  clayBlend: number,
) {
  const lerpColor = (a: number, b: number, t: number) =>
    Math.round(a + (b - a) * t);

  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  const mix = (hard: string, clay: string, t: number) => {
    const [hr, hg, hb] = parse(hard);
    const [cr, cg, cb] = parse(clay);
    return `rgb(${lerpColor(hr, cr, t)},${lerpColor(hg, cg, t)},${lerpColor(hb, cb, t)})`;
  };

  const isFullClay = clayBlend >= 0.95;
  const isFullHard = clayBlend <= 0.05;
  const isClay = clayBlend > 0.35;

  let surface: string;
  let surfaceDark: string;
  let outer: string;
  let line: string;
  let useChalk: boolean;

  if (isFullClay) {
    surface = CLAY_COURT.surface;
    surfaceDark = CLAY_COURT.surfaceDark;
    outer = CLAY_COURT.outer;
    line = CLAY_COURT.line;
    useChalk = true;
  } else if (isFullHard) {
    surface = HARD_COURT.surface;
    surfaceDark = HARD_COURT.surfaceDark;
    outer = HARD_COURT.outer;
    line = HARD_COURT.line;
    useChalk = false;
  } else {
    surface = mix(HARD_COURT.surface, CLAY_COURT.surface, clayBlend);
    surfaceDark = mix(HARD_COURT.surfaceDark, CLAY_COURT.surfaceDark, clayBlend);
    outer = mix(HARD_COURT.outer, CLAY_COURT.outer, clayBlend);
    line = isClay ? CLAY_COURT.line : HARD_COURT.line;
    useChalk = isClay;
  }

  ctx.save();
  ctx.filter = `blur(${COURT_BLUR_PX}px)`;
  ctx.translate(w / 2, h / 2);
  ctx.transform(1, tiltX * 0.04, tiltY * 0.02, 1, 0, 0);

  const { courtW, courtH } = fitCourtDimensions(w, h);

  const pad = Math.max(8, courtW * 0.015);
  ctx.fillStyle = outer;
  ctx.fillRect(-courtW / 2 - pad, -courtH / 2 - pad, courtW + pad * 2, courtH + pad * 2);

  const surfaceGrad = ctx.createLinearGradient(0, -courtH / 2, 0, courtH / 2);
  surfaceGrad.addColorStop(0, surface);
  surfaceGrad.addColorStop(1, surfaceDark);
  ctx.fillStyle = surfaceGrad;
  ctx.fillRect(-courtW / 2, -courtH / 2, courtW, courtH);

  if (!isFullHard && clayBlend > 0) {
    drawClayTexture(
      ctx,
      -courtW / 2,
      -courtH / 2,
      courtW,
      courtH,
      isFullClay ? 1 : clayBlend,
    );
  }

  drawRegulationCourtLines(ctx, courtW, courtH, { lineColor: line, chalk: useChalk });

  ctx.restore();
}

function ensureCourtCache(
  cache: CourtCache,
  w: number,
  h: number,
  clayBlend: number,
  dpr: number,
) {
  const clayKey = quantizeClayBlend(clayBlend);

  if (
    cache.canvas &&
    cache.w === w &&
    cache.h === h &&
    cache.clayBlend === clayKey
  ) {
    return cache.canvas;
  }

  if (!cache.canvas) {
    cache.canvas = document.createElement("canvas");
  }

  cache.canvas.width = Math.round(w * dpr);
  cache.canvas.height = Math.round(h * dpr);
  const cacheCtx = cache.canvas.getContext("2d");
  if (!cacheCtx) return cache.canvas;

  cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cacheCtx.clearRect(0, 0, w, h);
  drawCourt(cacheCtx, w, h, 0, 0, clayBlend);

  cache.w = w;
  cache.h = h;
  cache.clayBlend = clayKey;
  return cache.canvas;
}

function drawCachedCourtWithTilt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tiltX: number,
  tiltY: number,
  cacheCanvas: HTMLCanvasElement,
) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.transform(1, tiltX * 0.04, tiltY * 0.02, 1, 0, 0);
  ctx.drawImage(cacheCanvas, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  canvasColors: CanvasColors,
) {
  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.2, 0, w / 2, h * 0.2, w * 0.8);
  bgGrad.addColorStop(0, canvasColors.glow);
  bgGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = canvasColors.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
}

const InteractiveCourt = forwardRef<InteractiveCourtHandle>(function InteractiveCourt(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cursorBallRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, radius: 20 });
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const tiltRef = useRef({ x: 0, y: 0 });
  const tiltTargetRef = useRef({ x: 0, y: 0 });
  const clayRef = useRef({ active: 0, blend: 1 });
  const autoTimerRef = useRef(0);
  const frameRef = useRef<number>(0);
  const burstRef = useRef<() => void>(() => {});
  const canvasColorsRef = useRef<CanvasColors>(readCanvasColors());
  const courtCacheRef = useRef<CourtCache>({ canvas: null, w: 0, h: 0, clayBlend: -1 });
  const dprRef = useRef(1);

  useImperativeHandle(ref, () => ({
    triggerRain() {
      const w = window.innerWidth;
      for (let i = 0; i < 35; i++) {
        if (ballsRef.current.length >= MAX_BALLS) break;
        ballsRef.current.push(
          createBall(
            Math.random() * w,
            -20 - Math.random() * 200,
            (Math.random() - 0.5) * 120,
            200 + Math.random() * 180,
          ),
        );
      }
      playRacketSound(0.05);
    },
    triggerBurst() {
      burstRef.current();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const refreshCanvasColors = () => {
      canvasColorsRef.current = readCanvasColors();
    };

    refreshCanvasColors();
    const themeObserver = new MutationObserver(refreshCanvasColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const invalidateCourtCache = () => {
      courtCacheRef.current.w = 0;
      courtCacheRef.current.h = 0;
      courtCacheRef.current.clayBlend = -1;
    };

    const resize = () => {
      dprRef.current = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dprRef.current;
      canvas.height = window.innerHeight * dprRef.current;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);

      cursorBallRef.current.x = window.innerWidth / 2;
      cursorBallRef.current.y = window.innerHeight / 2;
      cursorBallRef.current.targetX = cursorBallRef.current.x;
      cursorBallRef.current.targetY = cursorBallRef.current.y;

      invalidateCourtCache();

      if (ballsRef.current.length === 0) {
        for (let i = 0; i < 4; i++) {
          ballsRef.current.push(
            createBall(
              Math.random() * window.innerWidth,
              Math.random() * window.innerHeight,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20,
              {
                floating: true,
                opacity: 0.35 + Math.random() * 0.25,
                blur: 1.5 + Math.random() * 2,
                radius: 18 + Math.random() * 20,
              },
            ),
          );
        }
      }
    };

    resize();

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", onResize);

    const updatePointer = (clientX: number, clientY: number) => {
      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      cursorBallRef.current.targetX = clientX;
      cursorBallRef.current.targetY = clientY;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const maxTilt = 0.5;
      tiltTargetRef.current.x = clamp((clientX - cx) / cx, -maxTilt, maxTilt);
      tiltTargetRef.current.y = clamp((clientY - cy) / cy, -maxTilt, maxTilt);
    };

    const burst = () => {
      for (let i = 0; i < 24; i++) {
        if (ballsRef.current.length >= MAX_BALLS) break;
        ballsRef.current.push(
          createBall(
            Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
            window.innerHeight * 0.65 + Math.random() * 100,
            150 + Math.random() * 250,
            -300 - Math.random() * 200,
          ),
        );
      }
      playRacketSound(0.1);
    };
    burstRef.current = burst;

    const onMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    const addBallAt = (x: number, y: number, catchOnly = false) => {
      let caught = false;
      for (const ball of ballsRef.current) {
        if (ball.floating) continue;
        const dist = Math.hypot(ball.x - x, ball.y - y);
        if (dist < ball.radius + 18) {
          ball.expression = Math.random() > 0.5 ? "happy" : "wink";
          ball.vx *= 0.5;
          ball.vy = -Math.abs(ball.vy) - 80;
          caught = true;
          playRacketSound(0.06);
          break;
        }
      }
      if (catchOnly || caught) return;

      if (ballsRef.current.length >= MAX_BALLS) {
        ballsRef.current.shift();
      }
      ballsRef.current.push(
        createBall(
          x,
          y,
          (Math.random() - 0.5) * 180,
          -220 - Math.random() * 160,
        ),
      );
      spawnParticles(particlesRef.current, x, y);
      playRacketSound(0.07);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, form, header, footer")) return;
      addBallAt(e.clientX, e.clientY);
    };

    const onDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, form, header, footer")) return;
      clayRef.current.active = 3.5;
      playRacketSound(0.04);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      burst();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("dblclick", onDblClick);
    window.addEventListener("keydown", onKeyDown);

    const renderScene = (w: number, h: number, drawDynamic = true) => {
      ctx.clearRect(0, 0, w, h);
      drawBackground(ctx, w, h, canvasColorsRef.current);

      const courtCache = ensureCourtCache(
        courtCacheRef.current,
        w,
        h,
        clayRef.current.blend,
        dprRef.current,
      );
      drawCachedCourtWithTilt(
        ctx,
        w,
        h,
        tiltRef.current.x,
        tiltRef.current.y,
        courtCache,
      );

      if (!drawDynamic) return;

      const balls = ballsRef.current;
      for (const ball of balls) {
        if (!ball.floating) drawBall(ctx, ball);
      }
      for (const ball of balls) {
        if (ball.floating) drawBall(ctx, ball);
      }

      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = clayRef.current.blend > 0.5
          ? "rgba(230,180,120,0.7)"
          : "rgba(180,220,255,0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const cursor = cursorBallRef.current;
      drawBall(ctx, {
        id: -1,
        x: cursor.x,
        y: cursor.y,
        vx: 0,
        vy: 0,
        radius: cursor.radius,
        mass: 1,
        expression: "normal",
        floating: false,
        floatPhase: 0,
        opacity: 0.92,
        blur: 0,
        rotation: performance.now() * 0.002,
        spin: 0,
      });
    };

    if (reducedMotion) {
      renderScene(window.innerWidth, window.innerHeight, false);
      return () => {
        themeObserver.disconnect();
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("click", onClick);
        window.removeEventListener("dblclick", onDblClick);
        window.removeEventListener("keydown", onKeyDown);
      };
    }

    let lastTime = performance.now();
    let running = true;

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameRef.current);
        return;
      }
      running = true;
      lastTime = performance.now();
      frameRef.current = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", onVisibility);

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (clayRef.current.active > 0) {
        clayRef.current.active -= dt;
        clayRef.current.blend = Math.max(0, clayRef.current.blend - dt * 2.5);
      } else {
        clayRef.current.blend = Math.min(1, clayRef.current.blend + dt * 1.2);
      }

      autoTimerRef.current -= dt;
      if (autoTimerRef.current <= 0) {
        autoTimerRef.current = 9 + Math.random() * 8;
        const fromLeft = Math.random() > 0.5;
        ballsRef.current.push(
          createBall(
            fromLeft ? -30 : w + 30,
            h * (0.35 + Math.random() * 0.25),
            fromLeft ? 320 + Math.random() * 80 : -320 - Math.random() * 80,
            (Math.random() - 0.5) * 60,
            { radius: 11 + Math.random() * 4 },
          ),
        );
      }

      const cursor = cursorBallRef.current;
      cursor.x += (cursor.targetX - cursor.x) * (1 - Math.pow(0.001, dt));
      cursor.y += (cursor.targetY - cursor.y) * (1 - Math.pow(0.001, dt));

      const tiltLerp = 1 - Math.pow(0.0001, dt);
      tiltRef.current.x += (tiltTargetRef.current.x - tiltRef.current.x) * tiltLerp;
      tiltRef.current.y += (tiltTargetRef.current.y - tiltRef.current.y) * tiltLerp;

      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        if (ball.floating) {
          ball.floatPhase += dt * 0.8;
          ball.x += Math.sin(ball.floatPhase) * 12 * dt;
          ball.y += Math.cos(ball.floatPhase * 0.7) * 10 * dt;
          ball.rotation += ball.spin * dt * 0.3;
          if (ball.x < -50) ball.x = w + 50;
          if (ball.x > w + 50) ball.x = -50;
          if (ball.y < -50) ball.y = h + 50;
          if (ball.y > h + 50) ball.y = -50;
          continue;
        }

        ball.vy += GRAVITY * dt;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.rotation += ball.spin * dt;

        const floor = h - 8;
        if (ball.y + ball.radius > floor) {
          ball.y = floor - ball.radius;
          ball.vy *= -BOUNCE;
          ball.vx *= 0.92;
          if (Math.abs(ball.vy) > 40) {
            spawnParticles(particlesRef.current, ball.x, ball.y + ball.radius, 4);
          }
        }
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx *= -BOUNCE;
        }
        if (ball.x + ball.radius > w) {
          ball.x = w - ball.radius;
          ball.vx *= -BOUNCE;
        }
        if (ball.y + ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy *= -BOUNCE;
        }

        if (ball.y > h + 120 && Math.abs(ball.vy) < 20) {
          balls.splice(i, 1);
        }
      }

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (balls[i].floating && balls[j].floating) continue;
          resolveCollision(balls[i], balls[j]);
        }
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.vy += 120 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      renderScene(w, h, true);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("click", onClick);
      window.removeEventListener("dblclick", onDblClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
});

export default InteractiveCourt;
