"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import { predictTree } from "../shared/cart";
import type { ClassData } from "../shared/ClassDataControls";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import { forestVotes, type ForestState } from "./algorithm";
import styles from "./Scene.module.css";

export type ForestData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const THUMBS = { x0: 440, y0: 50, size: 98, gap: 12 };
const DOMAIN: [number, number] = [0, 10];
const BANDS = 8;
const round1 = (v: number) => Math.round(v * 10) / 10;

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<ForestState, ForestData>) {
  const t = useT();
  // While the data is stale only the student's own points (and query) are drawn, never the old model.
  const show = (part: string) => (!stale || part === "points" || part === "query") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const pts = data.points;
  const fits = s.counts.length === pts.length;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const editable = !!onData && data.presetId === "custom";
  const isSample = frame.event === "sample";
  const isGrow = frame.event === "grow";
  const newest = s.trees.at(-1);

  const forestMap = useMemo(
    () => (s.trees.length ? regionGrid((x, y) => forestVotes(s.trees, x, y).share, DOMAIN, DOMAIN, 28) : null),
    [s.trees],
  );
  const treeMap = useMemo(() => (newest ? regionGrid((x, y) => predictTree(newest.nodes, x, y), DOMAIN, DOMAIN, 28) : null), [newest]);
  const thumbs = useMemo(
    () => s.trees.slice(-9).map((tr) => regionGrid((x, y) => predictTree(tr.nodes, x, y), DOMAIN, DOMAIN, 12)),
    [s.trees],
  );

  const cells = (g: NonNullable<typeof forestMap>, cls: (v: number) => string) =>
    g.cells.map((c, k) => (
      <rect
        key={k}
        className={cls(c.v)}
        x={sc.sx(c.x - g.size[0] / 2)}
        y={sc.sy(c.y + g.size[1] / 2)}
        width={sc.sx(g.size[0]) - sc.sx(0) + 0.6}
        height={sc.sy(0) - sc.sy(g.size[1]) + 0.6}
      />
    ));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("rf.scene.label")}>
      {show("tree") && isGrow && treeMap && (
        <g data-part="tree-map" pointerEvents="none">
          {cells(treeMap, (v) => styles[`m${v}`])}
        </g>
      )}
      {show("forest") && !isGrow && !isSample && forestMap && (
        <g data-part="forest-map" pointerEvents="none">
          {cells(forestMap, (v) => styles[`p${Math.min(BANDS - 1, Math.floor(v * BANDS))}`])}
        </g>
      )}
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("dt.feature.0")}
        yLabel={t("dt.feature.1")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] }) : undefined}
      >
        {() => null}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => {
          const count = fits ? s.counts[i] : 1;
          const leftOut = show("sample") && isSample && count === 0;
          return (
            <g key={i} data-part="point" data-left-out={leftOut}>
              <ClassMarker
                x={sc.sx(p.x)}
                y={sc.sy(p.y)}
                c={p.c}
                r={5}
                dim={leftOut}
                onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined}
              />
              {show("sample") && isSample && count > 1 && (
                <text data-part="count-badge" className={styles.badge} x={sc.sx(p.x) + 7} y={sc.sy(p.y) - 6}>
                  ×{count}
                </text>
              )}
            </g>
          );
        })}

      {show("thumbs") && (
        <g>
          <text className={styles.caption} x={THUMBS.x0} y={30}>
            {t("rf.scene.thumbs", { n: s.trees.length })}
          </text>
          {thumbs.map((g, k) => {
            const col = k % 3;
            const row = Math.floor(k / 3);
            const x0 = THUMBS.x0 + col * (THUMBS.size + THUMBS.gap);
            const y0 = THUMBS.y0 + row * (THUMBS.size + THUMBS.gap);
            const cell = THUMBS.size / 12;
            const latest = k === thumbs.length - 1 && (isGrow || frame.event === "vote");
            return (
              <g key={k} data-part="thumb">
                {g.cells.map((c, j) => (
                  <rect key={j} className={styles[`m${c.v}`]} x={x0 + (c.x / 10) * THUMBS.size - cell / 2} y={y0 + THUMBS.size - (c.y / 10) * THUMBS.size - cell / 2} width={cell + 0.4} height={cell + 0.4} />
                ))}
                <rect className={latest ? styles.thumbLatest : styles.thumbFrame} x={x0} y={y0} width={THUMBS.size} height={THUMBS.size} rx={4} />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
