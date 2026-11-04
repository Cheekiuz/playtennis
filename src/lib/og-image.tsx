import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

type BrandImageInput = {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
  chips?: string[];
  footer?: string;
};

/** Brand-consistent 1200 x 630 share card: forest green, lime accent, perspective court and ball. */
export function renderBrandImage({ eyebrow, title, accent, subtitle, chips = [], footer = "playtennis.lt" }: BrandImageInput) {
  const titleSize = title.length > 40 ? 52 : title.length > 22 ? 60 : 68;
  const shortSubtitle = subtitle && subtitle.length > 110 ? `${subtitle.slice(0, 107).trimEnd()}...` : subtitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #0d2818 0%, #123526 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: 60,
            width: 760,
            height: 560,
            display: "flex",
            background: "radial-gradient(circle, rgba(84,128,74,0.45) 0%, rgba(13,40,24,0) 70%)",
          }}
        />

        <svg
          width="600"
          height="410"
          viewBox="0 0 380 260"
          style={{ position: "absolute", right: 30, bottom: 70 }}
        >
          <defs>
            <linearGradient id="s" x1="226" y1="22" x2="74" y2="236" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4a6c40" />
              <stop offset="1" stopColor="#355f3b" />
            </linearGradient>
            <radialGradient id="b" cx="0.38" cy="0.3" r="0.82">
              <stop offset="0" stopColor="#e9fc9a" />
              <stop offset="0.45" stopColor="#d0ef70" />
              <stop offset="0.8" stopColor="#b0d44c" />
              <stop offset="1" stopColor="#8db43d" />
            </radialGradient>
            <clipPath id="c">
              <circle cx="264" cy="114" r="43.5" />
            </clipPath>
          </defs>
          <polygon points="36,74 236,32 355,158 84,246" fill="#06140d" opacity="0.55" />
          <polygon points="26.5,63.8 225.8,22.3 344.9,148.4 73.7,235.6" fill="url(#s)" />
          <g stroke="#a9c08f" strokeWidth="1.1" fill="none" opacity="0.7">
            <polygon points="26.5,63.8 225.8,22.3 344.9,148.4 73.7,235.6" />
            <line x1="51" y1="58.6" x2="98" y2="231.5" />
            <line x1="201" y1="27.5" x2="323" y2="153.3" />
            <line x1="62" y1="105" x2="242" y2="68" />
            <line x1="80" y1="175" x2="262" y2="118" />
          </g>
          <line x1="35" y1="126" x2="280" y2="66" stroke="#c3d4ac" strokeWidth="1.4" opacity="0.85" />
          <ellipse cx="250" cy="170" rx="38" ry="11" fill="#07170f" opacity="0.45" />
          <circle cx="264" cy="114" r="43.5" fill="url(#b)" />
          <g clipPath="url(#c)" stroke="#f2fbc8" strokeWidth="2.3" fill="none" strokeLinecap="round">
            <path d="M225 95C240 105 255 123 259 157" />
            <path d="M274 71C276 94 287 118 304 135" />
          </g>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px", width: 700 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#c8ff00",
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 28,
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              <span>{title}</span>
              {accent ? <span style={{ color: "#c8ff00" }}>{accent}</span> : null}
            </div>
            {shortSubtitle ? (
              <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>
                {shortSubtitle}
              </div>
            ) : null}
            {chips.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: 28 }}>
                {chips.map((chip) => (
                  <div
                    key={chip}
                    style={{
                      display: "flex",
                      marginRight: 12,
                      marginBottom: 12,
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "1.5px solid rgba(200,255,0,0.45)",
                      fontSize: 22,
                      color: "#e6f6a8",
                    }}
                  >
                    {chip}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{footer}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
