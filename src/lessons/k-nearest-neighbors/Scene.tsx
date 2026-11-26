"use client";

import { useT } from "@/i18n/ui-context";
import type { ClassData } from "../shared/ClassDataControls";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import type { SceneProps } from "../types";
import type { KnnState, Query } from "./algorithm";
import styles from "./Scene.module.css";

export type KnnData = ClassData & { query: Query };

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const DOMAIN: [number, number] = [0, 10];
const VOTES = { x0: 470, x1: 740, y0: 56, row: 26 };
const LIST = { x0: 470, x1: 740, y0: 196, row: 15, max: 9 };
const round1 = (v: number) => Math.round(v * 10) / 10;

export function Scene({ trace, index, data, reveal, onData }: SceneProps<KnnState, KnnData>) {
  const t = useT();
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const s = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))].state;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const q = s.query;
  const pts = data.points;
  // The recorded run belongs to these points only if the counts match.
  const fits = !s.distances || s.distances.length === pts.length;
  const nearest = fits && s.nearest ? s.nearest : [];
  const kth = nearest.length && s.distances ? s.distances[nearest[nearest.length - 1]] : 0;
  const editable = !!onData && data.presetId === "custom";
  const r = sc.sx(kth) - sc.sx(0);

  const onPlotClick = onData
    ? (p: { x: number; y: number }) =>
        editable
          ? onData({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] })
          : onData({ ...data, query: { x: round1(p.x), y: round1(p.y) } })
    : undefined;

  const maxVotes = Math.max(1, ...(s.votes ?? [1]));
  const maxDist = Math.max(1e-9, ...nearest.slice(0, LIST.max).map((i) => s.distances![i]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("knn.scene.label")}>
      <defs>
        <clipPath id="knn-plot">
          <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0} />
        </clipPath>
      </defs>
      {show("map") && s.map && (
        <g data-part="map" clipPath="url(#knn-plot)" pointerEvents="none">
          {s.map.cells.map((c, k) => (
            <rect
              key={k}
              className={styles[`m${c.v}`]}
              x={sc.sx(c.x - s.map!.size[0] / 2)}
              y={sc.sy(c.y + s.map!.size[1] / 2)}
              width={sc.sx(s.map!.size[0]) - sc.sx(0) + 0.6}
              height={sc.sy(0) - sc.sy(s.map!.size[1]) + 0.6}
            />
          ))}
        </g>
      )}
      <Plot2D box={PLOT} x={DOMAIN} y={DOMAIN} xLabel={t("knn.axis.x")} yLabel={t("knn.axis.y")} onPlotClick={onPlotClick}>
        {() => (
          <g clipPath="url(#knn-plot)">
            {show("distances") && fits && s.distances && !s.nearest &&
              pts.map((p, i) => (
                <line key={i} data-part="distance" className={styles.distance} pointerEvents="none" x1={sc.sx(q.x)} y1={sc.sy(q.y)} x2={sc.sx(p.x)} y2={sc.sy(p.y)} />
              ))}
            {show("nearest") && nearest.length > 0 && (
              <>
                {s.metric === "euclidean" ? (
                  <circle data-part="radius" className={styles.radius} pointerEvents="none" cx={sc.sx(q.x)} cy={sc.sy(q.y)} r={r} />
                ) : (
                  <polygon
                    data-part="radius"
                    className={styles.radius}
                    pointerEvents="none"
                    points={`${sc.sx(q.x)},${sc.sy(q.y) - r} ${sc.sx(q.x) + r},${sc.sy(q.y)} ${sc.sx(q.x)},${sc.sy(q.y) + r} ${sc.sx(q.x) - r},${sc.sy(q.y)}`}
                  />
                )}
                {nearest.map((i) => (
                  <line key={i} data-part="neighbour" className={styles.neighbour} pointerEvents="none" x1={sc.sx(q.x)} y1={sc.sy(q.y)} x2={sc.sx(pts[i].x)} y2={sc.sy(pts[i].y)} />
                ))}
              </>
            )}
          </g>
        )}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => (
          <ClassMarker
            key={i}
            x={sc.sx(p.x)}
            y={sc.sy(p.y)}
            c={p.c}
            dim={nearest.length > 0 && !nearest.includes(i)}
            onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined}
          />
        ))}
      {show("query") && (
        <g data-part="query" pointerEvents="none" transform={`translate(${sc.sx(q.x)} ${sc.sy(q.y)})`}>
          <polygon className={`${styles.query} ${s.prediction !== undefined ? styles[`q${s.prediction}`] : ""}`} points={starPoints(11, 5)} />
        </g>
      )}

      {show("votes") && s.votes && (
        <g data-part="votes">
          <text className={styles.caption} x={VOTES.x0} y={VOTES.y0 - 16}>
            {t("knn.scene.votes")}
          </text>
          {s.votes.map((v, c) => {
            const y = VOTES.y0 + c * VOTES.row;
            const w = ((VOTES.x1 - VOTES.x0 - 60) * v) / maxVotes;
            return (
              <g key={c}>
                <ClassMarker x={VOTES.x0 + 8} y={y + 8} c={c as 0 | 1 | 2} r={6} />
                <rect className={styles[`bar${c}`]} x={VOTES.x0 + 24} y={y + 1} width={Math.max(1, w)} height={14} rx={3} />
                <text className={styles.count} x={VOTES.x0 + 30 + w} y={y + 13}>
                  {v}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {show("nearest") && nearest.length > 0 && (
        <g data-part="ranking">
          <text className={styles.caption} x={LIST.x0} y={LIST.y0 - 14}>
            {t("knn.scene.nearest")}
          </text>
          {nearest.slice(0, LIST.max).map((i, rank) => {
            const y = LIST.y0 + rank * LIST.row;
            const d = s.distances![i];
            return (
              <g key={i}>
                <text className={styles.count} x={LIST.x0} y={y + 9}>
                  {rank + 1}
                </text>
                <ClassMarker x={LIST.x0 + 24} y={y + 5} c={pts[i].c} r={4.5} />
                <rect className={styles.distBar} x={LIST.x0 + 36} y={y + 1} width={((LIST.x1 - LIST.x0 - 90) * d) / maxDist} height={8} rx={2} />
                <text className={styles.count} x={LIST.x1 - 40} y={y + 9}>
                  {d.toFixed(2)}
                </text>
              </g>
            );
          })}
          {nearest.length > LIST.max && (
            <text className={styles.caption} x={LIST.x0} y={LIST.y0 + LIST.max * LIST.row + 10}>
              {t("knn.scene.more", { n: nearest.length - LIST.max })}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

function starPoints(outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}
