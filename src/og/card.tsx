import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Palette from the spec (light theme). */
const C = { bg: "#f1e9dd", card: "#fdf9f2", ink: "#1d1b18", muted: "#7a7268", line: "#c4b7a5", green: "#cfe3b2", peach: "#fbdcbc" };

export interface OgCardProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Chapter swatch colour. */
  accent: string;
  footer: string;
}

/** The share image: an ML Lab card in the site's colours. */
export function ogCard({ eyebrow, title, description, accent, footer }: OgCardProps): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.bg, padding: 48 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: C.card,
            border: `3px solid ${C.ink}`,
            borderRadius: 24,
            boxShadow: `8px 8px 0 ${C.ink}`,
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: C.muted }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: accent, border: `2px solid ${C.ink}` }} />
            {eyebrow}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: title.length > 20 ? 64 : 92, lineHeight: 1.05, color: C.ink, letterSpacing: -2 }}>{title}</div>
            <div style={{ fontSize: 29, lineHeight: 1.35, color: C.muted, maxWidth: 980 }}>{description}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, color: C.ink }}>
            <div style={{ display: "flex", padding: "6px 18px", background: C.green, border: `2px solid ${C.ink}`, borderRadius: 12 }}>ML Lab</div>
            <div style={{ color: C.muted }}>{footer}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
