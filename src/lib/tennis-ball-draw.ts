export type BallExpression = "normal" | "happy" | "wink";

export interface DrawTennisBallOptions {
  rotation?: number;
  opacity?: number;
  blur?: number;
  expression?: BallExpression;
  showShadow?: boolean;
}

import { BALL_IMAGE_SRC } from "@/lib/tennis-ball-assets";

export { BALL_IMAGE_SRC, BALL_OG_IMAGE_SRC } from "@/lib/tennis-ball-assets";

let ballImage: HTMLImageElement | null = null;
let loadPromise: Promise<void> | null = null;

function loadImage(retriesLeft: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ballImage = img;
      resolve();
    };
    img.onerror = () => {
      if (retriesLeft > 0) {
        loadPromise = null;
        loadImage(retriesLeft - 1).then(resolve).catch(reject);
        return;
      }
      reject(new Error("Failed to load tennis ball image"));
    };
    img.src = BALL_IMAGE_SRC;
  });
}

export function preloadTennisBallImage(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ballImage) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = loadImage(1).catch((err) => {
    console.warn("[tennis-ball] preload failed:", err);
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

export function isTennisBallImageReady(): boolean {
  return ballImage !== null;
}

function drawExpression(
  ctx: CanvasRenderingContext2D,
  radius: number,
  expression: BallExpression,
) {
  if (expression === "normal") return;

  ctx.fillStyle = "#1f2937";
  ctx.strokeStyle = "#1f2937";
  const eyeY = -radius * 0.14;
  const eyeX = radius * 0.22;
  const eyeR = radius * 0.09;

  if (expression === "happy") {
    ctx.beginPath();
    ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, radius * 0.07);
    ctx.beginPath();
    ctx.arc(0, radius * 0.14, radius * 0.22, 0.2, Math.PI - 0.2);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, radius * 0.08);
  ctx.beginPath();
  ctx.moveTo(eyeX - radius * 0.11, eyeY);
  ctx.lineTo(eyeX + radius * 0.11, eyeY);
  ctx.stroke();
}

export function drawTennisBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  options: DrawTennisBallOptions = {},
) {
  if (!ballImage) return;

  const {
    rotation = 0,
    opacity = 1,
    blur = 0,
    expression = "normal",
    showShadow = true,
  } = options;

  ctx.save();
  ctx.globalAlpha = opacity;
  if (blur > 0) ctx.filter = `blur(${blur}px)`;

  if (showShadow) {
    ctx.save();
    ctx.translate(x, y + radius * 0.92);
    ctx.scale(1, 0.24);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.05);
    shadow.addColorStop(0, "rgba(0,0,0,0.38)");
    shadow.addColorStop(0.55, "rgba(0,0,0,0.12)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.translate(x, y);
  ctx.rotate(rotation);

  const d = radius * 2;
  ctx.drawImage(ballImage, -radius, -radius, d, d);

  if (expression !== "normal") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    drawExpression(ctx, radius, expression);
    ctx.restore();
  }

  ctx.restore();
}
