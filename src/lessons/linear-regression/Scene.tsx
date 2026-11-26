"use client";

import { useMemo, type MouseEvent } from "react";
import { useT } from "@/i18n/ui-context";
import type { SceneProps } from "../types";
import { toLine, type LrState, type Point } from "./algorithm";
import { getPreset } from "./presets";
import styles from "./Scene.module.css";
import { clipLine, niceDomain } from "../shared/axes";
import { clientToSvg } from "../shared/Plot2D";
import { buildSurface, isoProject, lossFor, makeHeightFn, surfaceRanges, type SurfaceBox } from "./surface";

export interface LrData {
  /** A preset id, or "custom" for points drawn by the student. */
  presetId: string;
  points: Point[];
}

const W = 780;
const H = 395;
const PLOT = { x0: 62, x1: 360, y0: 46, y1: 330 };
const GRID = 14;
const BOX_BASE = { origin: [592, 150] as [number, number], size: 158, heightScale: 0.6 };
const CUSTOM_DOMAIN = { x: [0, 10] as [number, number], y: [0, 100] as [number, number] };
const LIMIT = 2000;

const clampSvg = (v: number) => (Number.isFinite(v) ? Math.max(-LIMIT, Math.min(LIMIT, v)) : 0);

function axes(data: LrData) {
  if (data.presetId === "custom" || data.points.length === 0) {
    const t = (d: [number, number], s: number) => Array.from({ length: Math.round((d[1] - d[0]) / s) + 1 }, (_, i) => d[0] + i * s);
    return { x: { domain: CUSTOM_DOMAIN.x, ticks: t(CUSTOM_DOMAIN.x, 2) }, y: { domain: CUSTOM_DOMAIN.y, ticks: t(CUSTOM_DOMAIN.y, 20) } };
  }
  const ys = data.points.map((p) => p.y);
  // Non-negative quantities (scores, prices) start at 0 so early wrong guesses stay on screen.
  return { x: niceDomain(data.points.map((p) => p.x)), y: niceDomain(Math.min(...ys) >= 0 ? [0, ...ys] : ys) };
}

/** 0..1 height → one of six theme-aware colour bands. */
const band = (h: number) => styles[`h${Math.min(5, Math.floor(h * 6))}`];

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<LrState, LrData>) {
  const t = useT();
  // While the data is stale only the student's own points (and query) are drawn, never the old model.
  const show = (part: string) => (!stale || part === "points" || part === "query") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const { x: xAxis, y: yAxis } = useMemo(() => axes(data), [data]);
  const preset = getPreset(data.presetId);
  const xLabel = t(preset?.xLabelKey ?? "lr.axis.x");
  const yLabel = t(preset?.yLabelKey ?? "lr.axis.y");

  const sx = (x: number) => PLOT.x0 + ((x - xAxis.domain[0]) / (xAxis.domain[1] - xAxis.domain[0])) * (PLOT.x1 - PLOT.x0);
  const sy = (y: number) => PLOT.y1 - ((y - yAxis.domain[0]) / (yAxis.domain[1] - yAxis.domain[0])) * (PLOT.y1 - PLOT.y0);
  const fromSvg = (px: number, py: number): Point => ({
    x: xAxis.domain[0] + ((px - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * (xAxis.domain[1] - xAxis.domain[0]),
    y: yAxis.domain[0] + ((PLOT.y1 - py) / (PLOT.y1 - PLOT.y0)) * (yAxis.domain[1] - yAxis.domain[0]),
  });

  // The bowl belongs to the data the trace was trained on (its first frame's mean/std).
  const trained = useMemo(() => trainedPoints(trace, data), [trace, data]);
  const bowl = useMemo(() => {
    if (!trained) return null;
    const loss = lossFor(trained, trace.frames[0].state);
    const { wRange, bRange } = surfaceRanges(trained, trace);
    const box: SurfaceBox = { wRange, bRange, ...BOX_BASE };
    const polys = buildSurface(loss, wRange, bRange, GRID, box.heightScale);
    const height = makeHeightFn(loss, wRange, bRange, GRID);
    return { box, polys, height };
  }, [trained, trace]);

  const line = toLine(s);
  const predict = (x: number) => line.slope * x + line.intercept;
  const lineOk = Number.isFinite(line.slope) && Number.isFinite(line.intercept);
  const segment = lineOk ? clipLine(line, xAxis.domain, yAxis.domain) : null;
  const onErrorFrame = frame.codeLine === "error";

  const editable = !!onData && data.presetId === "custom";
  function addPoint(e: MouseEvent<SVGRectElement>) {
    if (!editable) return;
    // Map through the SVG's own transform: correct however the viewBox is scaled or letterboxed.
    const pt = clientToSvg(e.currentTarget.ownerSVGElement, e.clientX, e.clientY);
    if (!pt) return;
    const p = fromSvg(pt.x, pt.y);
    onData!({ ...data, points: [...data.points, { x: round1(p.x), y: round1(p.y) }] });
  }
  function removePoint(i: number) {
    if (!editable) return;
    onData!({ ...data, points: data.points.filter((_, k) => k !== i) });
  }

  const path = bowl ? pathPoints(trace, index, bowl.height, bowl.box) : [];
  const current = bowl && path.length ? path[path.length - 1] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("lr.scene.label")}>
      <defs>
        <clipPath id="lr-plot">
          <rect x={PLOT.x0} y={PLOT.y0 - 10} width={PLOT.x1 - PLOT.x0 + 10} height={PLOT.y1 - PLOT.y0 + 10} />
        </clipPath>
      </defs>

      <g className={styles.axis}>
        <path d={`M${PLOT.x0} ${PLOT.y0 - 14}V${PLOT.y1}H${PLOT.x1 + 8}`} />
        {xAxis.ticks.map((v) => (
          <text key={`x${v}`} x={sx(v)} y={PLOT.y1 + 17} textAnchor="middle">
            {v}
          </text>
        ))}
        {yAxis.ticks.map((v) => (
          <text key={`y${v}`} x={PLOT.x0 - 8} y={sy(v) + 4} textAnchor="end">
            {v}
          </text>
        ))}
        <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 38} textAnchor="middle">
          {xLabel}
        </text>
        <text x={PLOT.x0} y={PLOT.y0 - 24}>
          {yLabel}
        </text>
      </g>

      {editable && (
        <rect
          data-part="draw-area"
          className={styles.drawArea}
          x={PLOT.x0}
          y={PLOT.y0}
          width={PLOT.x1 - PLOT.x0}
          height={PLOT.y1 - PLOT.y0}
          onClick={addPoint}
        />
      )}

      <g clipPath="url(#lr-plot)">
        {show("residuals") &&
          lineOk &&
          data.points.map((p, i) => (
            <path
              key={`r${i}`}
              data-part="residual"
              pointerEvents="none"
              className={onErrorFrame ? `${styles.residual} ${styles.residualStrong}` : styles.residual}
              d={`M${clampSvg(sx(p.x))} ${clampSvg(sy(p.y))}V${clampSvg(sy(predict(p.x)))}`}
            />
          ))}
        {show("line") && segment && (
          <path
            data-part="line"
            className={styles.line}
            pointerEvents="none"
            d={`M${sx(segment[0][0])} ${sy(segment[0][1])}L${sx(segment[1][0])} ${sy(segment[1][1])}`}
          />
        )}
      </g>

      {show("points") &&
        data.points.map((p, i) => (
          <circle
            key={`p${i}`}
            data-part="point"
            className={editable ? `${styles.point} ${styles.removable}` : styles.point}
            cx={clampSvg(sx(p.x))}
            cy={clampSvg(sy(p.y))}
            r={6}
            onClick={editable ? () => removePoint(i) : undefined}
          />
        ))}

      {show("bowl") && bowl && (
        <g data-part="bowl">
          <text className={styles.caption} x={BOX_BASE.origin[0]} y={24} textAnchor="middle">
            {t("lr.scene.bowl")}
          </text>
          {bowl.polys.map((poly, i) => (
            <polygon
              key={i}
              className={`${styles.cell} ${band(poly.height)}`}
              points={poly.points
                .map(([x, y]) => `${(BOX_BASE.origin[0] + x * BOX_BASE.size).toFixed(1)},${(BOX_BASE.origin[1] + y * BOX_BASE.size).toFixed(1)}`)
                .join(" ")}
            />
          ))}
        </g>
      )}

      {show("path") && bowl && path.length > 0 && (
        <g>
          <polyline data-part="path" className={styles.path} points={path.map((p) => p.join(",")).join(" ")} />
          {path.slice(0, -1).map((p, i) => (
            <circle key={i} className={styles.pathDot} cx={p[0]} cy={p[1]} r={2.4} />
          ))}
        </g>
      )}
      {show("bowl") && current && <circle data-part="current" className={styles.current} cx={current[0]} cy={current[1]} r={7} />}
    </svg>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Points the trace was trained on: the current data if it matches, else null (no bowl). */
function trainedPoints(trace: SceneProps<LrState, LrData>["trace"], data: LrData): Point[] | null {
  const s0 = trace.frames[0]?.state;
  if (!s0 || data.points.length < 2) return null;
  const n = data.points.length;
  const mean = data.points.reduce((a, p) => a + p.x, 0) / n;
  const std = Math.sqrt(data.points.reduce((a, p) => a + (p.x - mean) ** 2, 0) / n);
  return Math.abs(mean - s0.mean) < 1e-9 && Math.abs(std - s0.std) < 1e-9 ? data.points : null;
}

/** Distinct model positions up to `index`, projected onto the bowl; non-finite states skipped. */
function pathPoints(
  trace: SceneProps<LrState, LrData>["trace"],
  index: number,
  height: (w: number, b: number) => number,
  box: SurfaceBox,
): [number, number][] {
  const out: [number, number][] = [];
  let last: LrState | null = null;
  for (let i = 0; i <= Math.min(index, trace.frames.length - 1); i++) {
    const s = trace.frames[i].state;
    if (!Number.isFinite(s.w) || !Number.isFinite(s.b)) continue;
    if (last && last.w === s.w && last.b === s.b) continue;
    last = s;
    const w = Math.max(box.wRange[0], Math.min(box.wRange[1], s.w));
    const b = Math.max(box.bRange[0], Math.min(box.bRange[1], s.b));
    const [x, y] = isoProject(w, b, height(w, b) + 0.02, box);
    out.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return out;
}
