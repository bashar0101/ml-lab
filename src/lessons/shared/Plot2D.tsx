"use client";

import type { MouseEvent, ReactNode } from "react";
import type { Range } from "./axes";
import styles from "./Plot2D.module.css";

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Scale2D {
  sx(x: number): number;
  sy(y: number): number;
  invert(px: number, py: number): { x: number; y: number };
}

export function makeScale(box: Box, [xa, xb]: Range, [ya, yb]: Range): Scale2D {
  return {
    sx: (x) => box.x0 + ((x - xa) / (xb - xa)) * (box.x1 - box.x0),
    sy: (y) => box.y1 - ((y - ya) / (yb - ya)) * (box.y1 - box.y0),
    invert: (px, py) => ({
      x: xa + ((px - box.x0) / (box.x1 - box.x0)) * (xb - xa),
      y: ya + ((box.y1 - py) / (box.y1 - box.y0)) * (yb - ya),
    }),
  };
}

/** Client (screen) coordinates → SVG user units, through the SVG's own transform. */
export function clientToSvg(svg: SVGSVGElement | null, clientX: number, clientY: number): { x: number; y: number } | null {
  const ctm = svg?.getScreenCTM?.();
  if (!ctm) return null;
  const m = ctm.inverse();
  return { x: m.a * clientX + m.c * clientY + m.e, y: m.b * clientX + m.d * clientY + m.f };
}

function ticksFor([a, b]: Range): number[] {
  const span = b - a;
  const step = span <= 6 ? 1 : span <= 12 ? 2 : span / 5;
  const out: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

export function Plot2D({
  box,
  x,
  y,
  xLabel,
  yLabel,
  ticks = true,
  children,
  onPlotClick,
}: {
  box: Box;
  x: Range;
  y: Range;
  xLabel?: string;
  yLabel?: string;
  ticks?: boolean;
  children(s: Scale2D): ReactNode;
  onPlotClick?(p: { x: number; y: number }): void;
}) {
  const s = makeScale(box, x, y);

  function click(e: MouseEvent<SVGRectElement>) {
    const p = clientToSvg(e.currentTarget.ownerSVGElement, e.clientX, e.clientY);
    if (p) onPlotClick?.(s.invert(p.x, p.y));
  }

  return (
    <g>
      {ticks && (
        <g className={styles.axis}>
          <path d={`M${box.x0} ${box.y0}V${box.y1}H${box.x1}`} />
          {ticksFor(x).map((v) => (
            <text key={`x${v}`} x={s.sx(v)} y={box.y1 + 16} textAnchor="middle">
              {v}
            </text>
          ))}
          {ticksFor(y).map((v) => (
            <text key={`y${v}`} x={box.x0 - 8} y={s.sy(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          {xLabel && (
            <text x={(box.x0 + box.x1) / 2} y={box.y1 + 34} textAnchor="middle">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text x={box.x0} y={box.y0 - 10}>
              {yLabel}
            </text>
          )}
        </g>
      )}
      <rect
        data-part="plot-area"
        className={onPlotClick ? styles.clickable : styles.area}
        x={box.x0}
        y={box.y0}
        width={box.x1 - box.x0}
        height={box.y1 - box.y0}
        onClick={onPlotClick ? click : undefined}
      />
      {children(s)}
    </g>
  );
}

const CLASS_STYLE = ["c0", "c1", "c2"] as const;

/** Class 0 = circle, 1 = square, 2 = triangle: shape tells classes apart, not only colour. */
export function ClassMarker({
  x,
  y,
  c,
  r = 6,
  dim = false,
  ring = false,
  onClick,
}: {
  x: number;
  y: number;
  c: 0 | 1 | 2;
  r?: number;
  dim?: boolean;
  ring?: boolean;
  onClick?(): void;
}) {
  const cls = [styles.marker, styles[CLASS_STYLE[c]], dim ? styles.dim : "", ring ? styles.ring : "", onClick ? styles.removable : ""]
    .filter(Boolean)
    .join(" ");
  const common = { "data-part": "point", "data-class": c, "data-wrong": ring ? "true" : undefined, className: cls, onClick };
  if (c === 0) return <circle {...common} cx={x} cy={y} r={r} />;
  if (c === 1) return <rect {...common} x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} rx={1.5} />;
  const h = r * 1.15;
  return <polygon {...common} points={`${x},${y - h} ${x + h},${y + h * 0.8} ${x - h},${y + h * 0.8}`} />;
}
