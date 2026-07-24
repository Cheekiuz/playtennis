export const CLAY_COLORS = {
  highlight: "#d4623a",
  mid: "#c04e28",
  shadow: "#9a3a1e",
  outer: "#7a3018",
  chalk: "rgba(255, 248, 235, 0.92)",
  chalkShadow: "rgba(200, 80, 40, 0.15)",
} as const;

export const CLAY_COURT = {
  surface: CLAY_COLORS.mid,
  surfaceDark: CLAY_COLORS.shadow,
  line: CLAY_COLORS.chalk,
  outer: CLAY_COLORS.outer,
};

export const HARD_COURT = {
  surface: "#6ec4f0",
  surfaceDark: "#4daee0",
  line: "rgba(255, 255, 255, 0.95)",
  outer: "#2e7db5",
} as const;

// ITF regulation dimensions (metres)
export const COURT_LENGTH_M = 23.77;
export const COURT_WIDTH_M = 10.97;
export const SINGLES_WIDTH_M = 8.23;
export const SERVICE_LINE_M = 6.4;
export const CENTER_MARK_M = 0.1;
export const LINE_WIDTH_M = 0.05;

export const COURT_RATIO = COURT_LENGTH_M / COURT_WIDTH_M;
export const SINGLES_HALF_RATIO = SINGLES_WIDTH_M / COURT_WIDTH_M / 2;
export const SERVICE_LINE_RATIO = SERVICE_LINE_M / (COURT_LENGTH_M / 2);
export const CENTER_MARK_RATIO = CENTER_MARK_M / COURT_LENGTH_M;
export const LINE_WIDTH_RATIO = LINE_WIDTH_M / COURT_WIDTH_M;

/** Background blur applied to the court layer (balls stay sharp). */
export const COURT_BLUR_PX = 4;

export interface CourtDimensions {
  courtW: number;
  courtH: number;
}

/**
 * Size portrait court to fill the viewport as background.
 * Picks width-first or height-first sizing — whichever is larger — so wide
 * screens get a full-width court (height may extend past viewport edges).
 */
export function fitCourtDimensions(
  viewportW: number,
  viewportH: number,
  fillFraction = 0.72,
): CourtDimensions {
  const byWidth = {
    courtW: viewportW * fillFraction,
    courtH: viewportW * fillFraction * COURT_RATIO,
  };
  const byHeight = {
    courtH: viewportH * fillFraction,
    courtW: (viewportH * fillFraction) / COURT_RATIO,
  };

  return byWidth.courtW >= byHeight.courtW ? byWidth : byHeight;
}

export interface CourtLayout {
  halfW: number;
  halfH: number;
  singlesX: number;
  serviceY: number;
  centerMarkLen: number;
  lineW: number;
}

export function computeCourtLayout(courtW: number, courtH: number): CourtLayout {
  const halfW = courtW / 2;
  const halfH = courtH / 2;
  return {
    halfW,
    halfH,
    singlesX: halfW * (SINGLES_WIDTH_M / COURT_WIDTH_M),
    serviceY: halfH * SERVICE_LINE_RATIO,
    centerMarkLen: courtH * CENTER_MARK_RATIO,
    lineW: Math.max(1.5, courtW * LINE_WIDTH_RATIO),
  };
}

export interface DrawCourtLinesOptions {
  lineColor: string;
  chalk: boolean;
}

export function drawRegulationCourtLines(
  ctx: CanvasRenderingContext2D,
  courtW: number,
  courtH: number,
  { lineColor, chalk }: DrawCourtLinesOptions,
) {
  const { halfW, halfH, singlesX, serviceY, centerMarkLen, lineW } =
    computeCourtLayout(courtW, courtH);

  const stroke = (width: number, drawFn: () => void) => {
    if (chalk) {
      drawChalkLine(ctx, width, drawFn);
    } else {
      drawStandardLine(ctx, lineColor, width, drawFn);
    }
  };

  const hLine = (y: number, x1: number, x2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  };

  const vLine = (x: number, y1: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  };

  // Doubles boundary (baselines + doubles sidelines)
  stroke(lineW, () => {
    hLine(-halfH, -halfW, halfW);
    hLine(halfH, -halfW, halfW);
    vLine(-halfW, -halfH, halfH);
    vLine(halfW, -halfH, halfH);
  });

  // Singles sidelines (full court length)
  stroke(lineW, () => {
    vLine(-singlesX, -halfH, halfH);
    vLine(singlesX, -halfH, halfH);
  });

  // Service lines (singles width only — no lines in doubles alleys)
  stroke(lineW, () => {
    hLine(-serviceY, -singlesX, singlesX);
    hLine(serviceY, -singlesX, singlesX);
  });

  // Center service line (net to each service line only)
  stroke(lineW, () => {
    vLine(0, -serviceY, 0);
    vLine(0, 0, serviceY);
  });

  // Net (centre of court)
  stroke(lineW, () => {
    hLine(0, -halfW, halfW);
  });

  // Center marks (10 cm ticks at midpoint of each baseline)
  stroke(lineW, () => {
    vLine(0, -halfH, -halfH + centerMarkLen);
    vLine(0, halfH, halfH - centerMarkLen);
  });
}

const PATTERN_SIZE = 256;
let clayPattern: CanvasPattern | null = null;

function createClayPattern(): CanvasPattern | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = PATTERN_SIZE;
  canvas.height = PATTERN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 0, PATTERN_SIZE);
  grad.addColorStop(0, CLAY_COLORS.highlight);
  grad.addColorStop(0.5, CLAY_COLORS.mid);
  grad.addColorStop(1, CLAY_COLORS.shadow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

  // Mottled warm-orange blotches
  for (let i = 0; i < 64; i++) {
    const x = Math.random() * PATTERN_SIZE;
    const y = Math.random() * PATTERN_SIZE;
    const radius = 10 + Math.random() * 32;
    const alpha = 0.1 + Math.random() * 0.2;
    const lighter = Math.random() > 0.5;
    ctx.fillStyle = lighter
      ? `rgba(240, 120, 70, ${alpha})`
      : `rgba(120, 40, 20, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.6 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine crushed-brick grain
  const imageData = ctx.getImageData(0, 0, PATTERN_SIZE, PATTERN_SIZE);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = clampByte(data[i] + noise);
    data[i + 1] = clampByte(data[i + 1] + noise * 0.7);
    data[i + 2] = clampByte(data[i + 2] + noise * 0.4);
  }
  ctx.putImageData(imageData, 0, 0);

  return ctx.createPattern(canvas, "repeat");
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getClayPattern(): CanvasPattern | null {
  if (!clayPattern) {
    clayPattern = createClayPattern();
  }
  return clayPattern;
}

export function drawClayTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity = 1,
) {
  if (intensity <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, CLAY_COLORS.highlight);
  grad.addColorStop(0.45, CLAY_COLORS.mid);
  grad.addColorStop(1, CLAY_COLORS.shadow);
  ctx.globalAlpha = intensity;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  const pattern = getClayPattern();
  if (pattern) {
    ctx.globalAlpha = intensity * 0.85;
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

export function drawChalkLine(
  ctx: CanvasRenderingContext2D,
  lineWidth: number,
  drawFn: () => void,
) {
  ctx.save();
  ctx.strokeStyle = CLAY_COLORS.chalk;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "butt";
  ctx.globalAlpha = 0.96;
  ctx.shadowColor = CLAY_COLORS.chalkShadow;
  ctx.shadowBlur = Math.max(1, lineWidth * 0.5);
  drawFn();
  ctx.restore();
}

export function drawStandardLine(
  ctx: CanvasRenderingContext2D,
  lineColor: string,
  lineWidth: number,
  drawFn: () => void,
) {
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "square";
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  drawFn();
  ctx.restore();
}
