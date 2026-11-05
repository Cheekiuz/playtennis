import HeroRandomBall from "@/components/HeroRandomBall";
import type { HeroPick } from "@/lib/tournaments/hero-pick";

/**
 * Hero visual: a perspective tennis court with a floating ball.
 *
 * The scene is authored in reference-screenshot pixels (viewBox 490 0 534 355).
 * Court markings are generated from real court dimensions and projected through a
 * homography onto the four measured corner points, so the court proportions stay
 * correct at any size.
 */

const VIEW = { x: 490, y: 0, w: 534, h: 355 } as const;

/** Court corners in scene space: far-left, far-right, near-right, near-left. */
const CORNERS = [
  [571.5, 123.8],
  [770.8, 82.3],
  [889.9, 208.4],
  [618.7, 295.6],
] as const;

const COURT_W = 10.97;
const COURT_L = 23.77;
const SINGLES_INSET = 1.37;
const SERVICE_FROM_BASELINE = 5.485;

/** Ball centre/diameter in scene space. */
const BALL = { cx: 809, cy: 174, d: 87 } as const;

type Point = readonly [number, number];

function makeProjector(c: typeof CORNERS) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const h = (dx1 * dy3 - dy1 * dx3) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;

  /** Maps court metres (x across, y along) to scene pixels. */
  return (mx: number, my: number): Point => {
    const u = mx / COURT_W;
    const v = my / COURT_L;
    const w = g * u + h * v + 1;
    return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
  };
}

const project = makeProjector(CORNERS);

const fmt = (p: Point) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const polyline = (pts: Point[]) => pts.map(fmt).join(" ");
const segment = (a: Point, b: Point) => `M${fmt(a)}L${fmt(b)}`;

const outline = polyline([
  project(0, 0),
  project(COURT_W, 0),
  project(COURT_W, COURT_L),
  project(0, COURT_L),
]);

const nearService = COURT_L - SERVICE_FROM_BASELINE;
const innerLines = [
  segment(project(SINGLES_INSET, 0), project(SINGLES_INSET, COURT_L)),
  segment(project(COURT_W - SINGLES_INSET, 0), project(COURT_W - SINGLES_INSET, COURT_L)),
  segment(project(SINGLES_INSET, SERVICE_FROM_BASELINE), project(COURT_W - SINGLES_INSET, SERVICE_FROM_BASELINE)),
  segment(project(SINGLES_INSET, nearService), project(COURT_W - SINGLES_INSET, nearService)),
  segment(project(COURT_W / 2, SERVICE_FROM_BASELINE), project(COURT_W / 2, nearService)),
].join("");

/* Net: top tape sits just above the centre line and runs slightly past both sidelines. */
const NET_OVERHANG = 0.5;
const NET_HEIGHT_LEFT = 7;
const NET_HEIGHT_RIGHT = 5;
const groundLeft = project(-NET_OVERHANG, COURT_L / 2);
const groundRight = project(COURT_W + NET_OVERHANG, COURT_L / 2);
const netLeft: Point = [groundLeft[0], groundLeft[1] - NET_HEIGHT_LEFT];
const netRight: Point = [groundRight[0], groundRight[1] - NET_HEIGHT_RIGHT];
const netBand = polyline([netLeft, netRight, groundRight, groundLeft]);
const netAngle = (Math.atan2(netRight[1] - netLeft[1], netRight[0] - netLeft[0]) * 180) / Math.PI;

const offsetOutline = (dx: number, dy: number) =>
  polyline(
    [project(0, 0), project(COURT_W, 0), project(COURT_W, COURT_L), project(0, COURT_L)].map(
      ([x, y]) => [x + dx, y + dy] as Point,
    ),
  );

/** Shadow cast by the ball onto the court, aligned with the court's baseline direction. */
const baselineAngle =
  (Math.atan2(CORNERS[2][1] - CORNERS[3][1], CORNERS[2][0] - CORNERS[3][0]) * 180) / Math.PI;

const pct = (value: number, total: number, offset = 0) => `${(((value - offset) / total) * 100).toFixed(3)}%`;

const SPOKES = [0, 45, 90, 135];

export default function HeroIllustration({
  pool,
  label,
  caption,
  score,
  hint,
  hintSecondary,
}: {
  pool: HeroPick[];
  label: string;
  caption: string;
  score: string;
  hint: string;
  hintSecondary: string;
}) {
  return (
    <div className="relative w-full min-w-0 overflow-hidden text-white [container-type:size] aspect-[534/355] lg:aspect-auto lg:min-h-[400px]">
      {/* Soft green glow behind the illustration; fades in from the top when stacked on mobile. */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_28%)] lg:[mask-image:none]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 78% at 52% 54%, rgba(84,128,74,0.36) 0%, rgba(58,100,64,0.22) 45%, rgba(20,42,32,0) 78%), radial-gradient(ellipse 45% 55% at 88% 38%, rgba(40,78,52,0.30) 0%, rgba(13,40,24,0) 100%)",
        }}
      />

      {/* Scene box keeps the reference aspect ratio, so court and ball never distort. It may bleed past the panel edges (empty background only) to match the reference scale. */}
      <div className="absolute top-1/2 left-1/2 aspect-[534/355] w-[min(100cqw,calc(100cqh*1.5042))] lg:w-[min(110cqw,calc(100cqh*1.5042))] -translate-x-1/2 -translate-y-1/2">
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hc-surface" x1="771" y1="82" x2="619" y2="296" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#42623b" />
              <stop offset="0.5" stopColor="#3a5e3a" />
              <stop offset="1" stopColor="#335a37" />
            </linearGradient>
            <radialGradient id="hc-sheen" cx="700" cy="150" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#6d9a5a" stopOpacity="0.14" />
              <stop offset="1" stopColor="#6d9a5a" stopOpacity="0" />
            </radialGradient>
            <filter id="hc-blur-sm" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <filter id="hc-blur-lg" x="-30%" y="-30%" width="160%" height="170%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <filter id="hc-blur-ball" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="5.5" />
            </filter>
            <pattern
              id="hc-mesh"
              width="2.2"
              height="2.2"
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${netAngle.toFixed(2)})`}
            >
              <path d="M0 0.55H2.2M0.55 0V2.2" stroke="#c4d6ae" strokeWidth="0.45" fill="none" />
            </pattern>
            <clipPath id="hc-court-clip">
              <polygon points={outline} />
            </clipPath>
          </defs>

          {/* Soft offset shadows beneath the court */}
          <polygon points={offsetOutline(10, 20)} fill="#06140d" opacity="0.5" filter="url(#hc-blur-lg)" />
          <polygon points={offsetOutline(4, 9)} fill="#06140d" opacity="0.85" filter="url(#hc-blur-sm)" />

          {/* Court surface */}
          <polygon points={outline} fill="url(#hc-surface)" />
          <polygon points={outline} fill="url(#hc-sheen)" />

          {/* Ball shadow on the court */}
          <g clipPath="url(#hc-court-clip)">
            <ellipse
              cx={BALL.cx - 16}
              cy={BALL.cy + 46}
              rx="38"
              ry="11"
              fill="#07170f"
              opacity="0.4"
              filter="url(#hc-blur-ball)"
              transform={`rotate(${baselineAngle.toFixed(2)} ${BALL.cx - 16} ${BALL.cy + 46})`}
            />
          </g>

          {/* Court markings */}
          <g fill="none" stroke="#a9c08f" strokeLinecap="round" strokeLinejoin="round">
            <polygon points={outline} strokeWidth="1.1" opacity="0.62" />
            <path d={innerLines} strokeWidth="0.9" opacity="0.58" />
          </g>

          {/* Net: mesh, top tape and posts */}
          <polygon points={netBand} fill="url(#hc-mesh)" opacity="0.55" />
          <path d={segment(netLeft, netRight)} stroke="#c3d4ac" strokeWidth="1.1" opacity="0.8" fill="none" />
          <path
            d={`${segment(netLeft, [netLeft[0] - 1.2, netLeft[1] + 15])}${segment(netRight, [netRight[0], netRight[1] + 8])}`}
            stroke="#c3d4ac"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.75"
            fill="none"
          />

          {/* Decorative starburst */}
          <g transform="translate(951 112)" stroke="#7f9d62" strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
            {SPOKES.map((deg) => (
              <line key={deg} x1="0" y1="-12" x2="0" y2="12" transform={`rotate(${deg})`} />
            ))}
          </g>
        </svg>

        {/* Ball: interactive HTML button wrapping an SVG sphere */}
        <div
          className="absolute z-10 aspect-square"
          style={{
            width: pct(BALL.d, VIEW.w),
            left: pct(BALL.cx - BALL.d / 2, VIEW.w, VIEW.x),
            top: pct(BALL.cy - BALL.d / 2, VIEW.h),
          }}
        >
          <HeroRandomBall pool={pool} label={label} className="block h-full w-full">
            <svg viewBox="-100 -100 200 200" className="block h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <radialGradient id="hb-body" cx="0.38" cy="0.3" r="0.82">
                  <stop offset="0" stopColor="#e2fa86" />
                  <stop offset="0.42" stopColor="#d0ef70" />
                  <stop offset="0.78" stopColor="#b0d44c" />
                  <stop offset="1" stopColor="#8db43d" />
                </radialGradient>
                <radialGradient id="hb-shade" cx="0.3" cy="0.24" r="0.95">
                  <stop offset="0.55" stopColor="#4b7a14" stopOpacity="0" />
                  <stop offset="1" stopColor="#3f6a12" stopOpacity="0.38" />
                </radialGradient>
                <radialGradient id="hb-hilite" cx="0.34" cy="0.26" r="0.3">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <clipPath id="hb-clip">
                  <circle r="100" />
                </clipPath>
              </defs>
              <circle r="100" fill="url(#hb-body)" />
              <g clipPath="url(#hb-clip)" fill="none" stroke="#f2fbc8" strokeLinecap="round">
                <path d="M-92 -42C-60 -22 -26 14 -18 97" strokeWidth="5.2" opacity="0.92" />
                <path d="M24 -97C28 -48 52 8 90 47" strokeWidth="5.2" opacity="0.92" />
              </g>
              <circle r="100" fill="url(#hb-shade)" />
              <circle r="100" fill="url(#hb-hilite)" />
            </svg>
          </HeroRandomBall>
        </div>
      </div>

      {/* Captions and controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-7 pt-6 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 lg:px-9 lg:pt-7">
        <span>{caption}</span>
        <span className="tabular-nums text-white/45">{score}</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-7 pb-6 lg:px-9 lg:pb-7">
        <div className="space-y-1">
          <p className="text-[13px] leading-5 font-medium text-white/90">{hint}</p>
          <p className="text-[11px] leading-4 text-white/50">{hintSecondary}</p>
        </div>
        <a
          href="#play-next"
          aria-label={label}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#a9c08f]/50 text-base text-[#c9dcb2] transition-colors hover:border-[#c8ff00] hover:text-[#c8ff00]"
        >
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
