"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import { niceDomain } from "../shared/axes";
import type { ClassData } from "../shared/ClassDataControls";
import { makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import type { KMeansState } from "./algorithm";
import styles from "./Scene.module.css";

export type KMeansData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const CHART = { x0: 470, y0: 60, x1: 750, y1: 320 };
const DOMAIN: [number, number] = [0, 10];
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Cluster markers: colour *and* a number, so clusters are told apart without colour. */
function ClusterPoint({ x, y, c, onClick }: { x: number; y: number; c: number | null; onClick?(): void }) {
  return (
    <circle
      data-part="point"
      data-cluster={c ?? undefined}
      className={`${styles.point} ${c === null ? styles.unassigned : styles[`k${c}`]}`}
      cx={x}
      cy={y}
      r={5.5}
      onClick={onClick}
    />
  );
}

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<KMeansState, KMeansData>) {
  const t = useT();
  const show = (part: string) => (!stale || part === "points") && (reveal === "all" || reveal.has(part));
  const i = Math.max(0, Math.min(trace.frames.length - 1, index));
  const s = trace.frames[i].state;
  const pts = data.points;
  const fits = !s.assign || s.assign.length === pts.length;
  const assign = fits && !stale ? s.assign : null;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const editable = !!onData && data.presetId === "custom";

  const regions = useMemo(
    () =>
      regionGrid(
        (x, y) => {
          let best = 0;
          s.centroids.forEach((c, j) => {
            if ((x - c.x) ** 2 + (y - c.y) ** 2 < (x - s.centroids[best].x) ** 2 + (y - s.centroids[best].y) ** 2) best = j;
          });
          return best;
        },
        DOMAIN,
        DOMAIN,
        28,
      ),
    [s.centroids],
  );

  // Inertia per finished iteration up to this frame.
  const series = trace.frames.slice(0, i + 1).filter((f) => f.event === "update" || (f.event === "done" && f.state.iteration === 0));
  const allInertia = trace.frames.filter((f) => f.event !== "init").map((f) => f.metrics.inertia);
  const yAxis = niceDomain(allInertia.length ? [0, ...allInertia] : [0, 1], 4);
  const maxIter = Math.max(1, ...trace.frames.map((f) => f.state.iteration));
  const cs = makeScale(CHART, [0, maxIter], yAxis.domain);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("km.scene.label")}>
      {show("regions") && assign && (
        <g data-part="regions" pointerEvents="none">
          {regions.cells.map((c, k) => (
            <rect
              key={k}
              className={styles[`r${c.v}`]}
              x={sc.sx(c.x - regions.size[0] / 2)}
              y={sc.sy(c.y + regions.size[1] / 2)}
              width={sc.sx(regions.size[0]) - sc.sx(0) + 0.6}
              height={sc.sy(0) - sc.sy(regions.size[1]) + 0.6}
            />
          ))}
        </g>
      )}
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("dt.feature.0")}
        yLabel={t("dt.feature.1")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: 0 }] }) : undefined}
      >
        {() => null}
      </Plot2D>
      {show("points") &&
        pts.map((p, k) => (
          <ClusterPoint
            key={k}
            x={sc.sx(p.x)}
            y={sc.sy(p.y)}
            c={assign ? assign[k] : null}
            onClick={editable ? () => onData!({ ...data, points: pts.filter((_, j) => j !== k) }) : undefined}
          />
        ))}
      {show("centroids") && (
        <g pointerEvents="none">
          {show("trails") &&
            s.trails.map((tr, j) => (
              <polyline key={j} data-part="trail" className={`${styles.trail} ${styles[`s${j}`]}`} points={tr.map((c) => `${sc.sx(c.x)},${sc.sy(c.y)}`).join(" ")} />
            ))}
          {s.centroids.map((c, j) => (
            <g key={j} data-part="centroid" transform={`translate(${sc.sx(c.x)} ${sc.sy(c.y)})`}>
              <path className={`${styles.cross} ${styles[`s${j}`]}`} d="M-9 -9L9 9M-9 9L9 -9" />
              <text className={styles.label} x={11} y={-8}>
                {j + 1}
              </text>
            </g>
          ))}
        </g>
      )}
      {show("chart") && (
        <g data-part="chart">
          <text className={styles.caption} x={(CHART.x0 + CHART.x1) / 2} y={36} textAnchor="middle">
            {t("km.scene.chart")}
          </text>
          <path className={styles.axis} d={`M${CHART.x0} ${CHART.y0}V${CHART.y1}H${CHART.x1}`} />
          {yAxis.ticks.map((v) => (
            <text key={v} className={styles.tick} x={CHART.x0 - 6} y={cs.sy(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          {Array.from({ length: maxIter + 1 }, (_, k) => k).map((k) => (
            <text key={k} className={styles.tick} x={cs.sx(k)} y={CHART.y1 + 16} textAnchor="middle">
              {k}
            </text>
          ))}
          <text className={styles.tick} x={(CHART.x0 + CHART.x1) / 2} y={CHART.y1 + 32} textAnchor="middle">
            {t("km.scene.iteration")}
          </text>
          <polyline className={styles.series} points={series.map((f) => `${cs.sx(f.state.iteration)},${cs.sy(f.metrics.inertia)}`).join(" ")} />
          {series.map((f, k) => (
            <circle key={k} className={styles.dot} cx={cs.sx(f.state.iteration)} cy={cs.sy(f.metrics.inertia)} r={3.5} />
          ))}
        </g>
      )}
    </svg>
  );
}
