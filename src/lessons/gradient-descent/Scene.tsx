"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import { niceDomain } from "../shared/axes";
import { contourSegments } from "../shared/contours";
import { makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import type { GdState, Optimizer } from "./algorithm";
import styles from "./Scene.module.css";
import { getSurface } from "./surfaces";

export interface GdData {
  /** Start point clicked by the student; null = the surface's own start. */
  start: [number, number] | null;
}

const W = 780;
const H = 395;
const MAP = { x0: 46, y0: 34, x1: 376, y1: 364 };
const CHART = { x0: 470, y0: 46, x1: 756, y1: 330 };
const LEVELS = 12;
const BANDS = 6;
const LIMIT = 4000;
const clampSvg = (v: number) => (Number.isFinite(v) ? Math.max(-LIMIT, Math.min(LIMIT, v)) : 0);

export function Scene({ trace, index, reveal, onData }: SceneProps<GdState, GdData>) {
  const t = useT();
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const i = Math.max(0, Math.min(trace.frames.length - 1, index));
  const frame = trace.frames[i];
  const surface = getSurface(trace.frames[0].state.surface);

  const map = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const g = regionGrid((x, y) => surface.f(x, y), surface.x, surface.y, 32);
    for (const c of g.cells) {
      lo = Math.min(lo, c.v);
      hi = Math.max(hi, c.v);
    }
    // Levels packed near the bottom, where the interesting part is.
    const level = (k: number) => lo + (hi - lo) * (k / LEVELS) ** 2;
    const band = (v: number) => {
      const k = Math.sqrt(Math.max(0, (v - lo) / (hi - lo || 1))) * BANDS;
      return Math.min(BANDS - 1, Math.floor(k));
    };
    const lines = Array.from({ length: LEVELS - 1 }, (_, k) => contourSegments(surface.f, surface.x, surface.y, 48, level(k + 1))).flat();
    return { cells: g.cells.map((c) => ({ ...c, band: band(c.v) })), size: g.size, lines };
  }, [surface]);

  const s = makeScale(MAP, surface.x, surface.y);
  const walkers = frame.state.walkers;

  // Path of every walker up to this frame (positions only change on update frames).
  const paths = walkers.map((_, w) => {
    const pts: [number, number][] = [];
    for (let k = 0; k <= i; k++) {
      const q = trace.frames[k].state.walkers[w];
      const last = pts.at(-1);
      const p: [number, number] = [clampSvg(s.sx(q.x)), clampSvg(s.sy(q.y))];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
    }
    return pts;
  });

  // Height-over-steps chart.
  const steps = Math.max(1, trace.frames.at(-1)!.state.step);
  const heights = trace.frames.flatMap((f) => f.state.walkers.map((w) => w.f)).filter((v) => Number.isFinite(v) && Math.abs(v) < 1e6);
  const yAxis = niceDomain(heights.length ? heights : [0, 1], 4);
  const cs = makeScale(CHART, [0, steps], yAxis.domain);
  const series = walkers.map((_, w) => {
    const pts: string[] = [];
    let lastStep = -1;
    for (let k = 0; k <= i; k++) {
      const st = trace.frames[k].state;
      if (st.step === lastStep) continue;
      lastStep = st.step;
      const f = st.walkers[w].f;
      if (!Number.isFinite(f) || Math.abs(f) > 1e6) continue;
      pts.push(`${cs.sx(st.step).toFixed(1)},${clampSvg(cs.sy(Math.max(yAxis.domain[0], Math.min(yAxis.domain[1], f)))).toFixed(1)}`);
    }
    return pts.join(" ");
  });

  const primary = walkers[0];
  const showArrow = show("arrow") && frame.codeLine === "grad" && !primary.diverged;
  const g = Math.hypot(primary.gx, primary.gy);
  const arrowLen = Math.min(70, 14 + g * 10);
  const ax = s.sx(primary.x);
  const ay = s.sy(primary.y);
  // Downhill is against the gradient; SVG y grows downwards.
  const ex = g > 0 ? ax - (primary.gx / g) * arrowLen : ax;
  const ey = g > 0 ? ay + (primary.gy / g) * arrowLen : ay;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("gd.scene.label")}>
      <defs>
        <marker id="gd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className={styles.arrowHead} />
        </marker>
        <clipPath id="gd-map">
          <rect x={MAP.x0} y={MAP.y0} width={MAP.x1 - MAP.x0} height={MAP.y1 - MAP.y0} />
        </clipPath>
      </defs>

      <text className={styles.caption} x={(MAP.x0 + MAP.x1) / 2} y={20} textAnchor="middle">
        {t("gd.scene.map")}
      </text>

      {show("surface") && (
        <g clipPath="url(#gd-map)">
          {map.cells.map((c, k) => (
            <rect
              key={k}
              className={styles[`b${c.band}`]}
              x={s.sx(c.x - map.size[0] / 2)}
              y={s.sy(c.y + map.size[1] / 2)}
              width={s.sx(map.size[0]) - s.sx(0) + 0.6}
              height={s.sy(0) - s.sy(map.size[1]) + 0.6}
            />
          ))}
          <g data-part="contour" className={styles.contour}>
            {map.lines.map((seg, k) => (
              <line key={k} x1={s.sx(seg[0][0])} y1={s.sy(seg[0][1])} x2={s.sx(seg[1][0])} y2={s.sy(seg[1][1])} />
            ))}
          </g>
        </g>
      )}

      <Plot2D
        box={MAP}
        x={surface.x}
        y={surface.y}
        ticks={false}
        onPlotClick={onData ? (p) => onData({ start: [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10] }) : undefined}
      >
        {() => null}
      </Plot2D>
      <rect x={MAP.x0} y={MAP.y0} width={MAP.x1 - MAP.x0} height={MAP.y1 - MAP.y0} className={styles.frame} pointerEvents="none" />

      <g clipPath="url(#gd-map)" pointerEvents="none">
        {show("path") &&
          paths.map((pts, w) => (
            <polyline key={w} data-part="path" className={`${styles.path} ${styles[walkers[w].optimizer]}`} points={pts.map((p) => p.join(",")).join(" ")} />
          ))}
        {showArrow && <line data-part="arrow" className={styles.arrow} x1={ax} y1={ay} x2={ex} y2={ey} markerEnd="url(#gd-arrow)" />}
        {show("ball") &&
          walkers.map((w, k) => (
            <circle
              key={w.optimizer}
              data-part="ball"
              className={`${styles.ball} ${styles[w.optimizer]} ${w.diverged ? styles.blown : ""}`}
              cx={clampSvg(s.sx(w.x))}
              cy={clampSvg(s.sy(w.y))}
              r={k === 0 ? 8 : 6.5}
            />
          ))}
      </g>

      {show("chart") && (
        <g data-part="chart">
          <text className={styles.caption} x={(CHART.x0 + CHART.x1) / 2} y={20} textAnchor="middle">
            {t("gd.scene.chart")}
          </text>
          <path className={styles.axis} d={`M${CHART.x0} ${CHART.y0}V${CHART.y1}H${CHART.x1}`} />
          {yAxis.ticks.map((v) => (
            <text key={v} className={styles.tick} x={CHART.x0 - 6} y={cs.sy(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          <text className={styles.tick} x={CHART.x0} y={CHART.y1 + 16} textAnchor="middle">
            0
          </text>
          <text className={styles.tick} x={CHART.x1} y={CHART.y1 + 16} textAnchor="middle">
            {steps}
          </text>
          <text className={styles.tick} x={(CHART.x0 + CHART.x1) / 2} y={CHART.y1 + 32} textAnchor="middle">
            {t("gd.scene.steps")}
          </text>
          {series.map((pts, w) => (
            <polyline key={w} className={`${styles.series} ${styles[walkers[w].optimizer]}`} points={pts} />
          ))}
        </g>
      )}

      {walkers.length > 1 && (
        <g data-part="legend" className={styles.legend} transform={`translate(${CHART.x0 + 10} ${CHART.y1 + 46})`}>
          {walkers.map((w, k) => (
            <g key={w.optimizer} transform={`translate(${k * 96} 0)`}>
              <line x1={0} y1={-4} x2={22} y2={-4} className={`${styles.series} ${styles[w.optimizer as Optimizer]}`} />
              <text x={28} y={0}>
                {t(`gd.optimizer.${w.optimizer}`)}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
