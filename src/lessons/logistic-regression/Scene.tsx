"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import { clipLine } from "../shared/axes";
import type { ClassData } from "../shared/ClassDataControls";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import { boundaryLine, logit, probability, sigmoid, type LogState } from "./algorithm";
import styles from "./Scene.module.css";

export type LogData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const SIG = { x0: 470, y0: 60, x1: 756, y1: 320 };
const DOMAIN: [number, number] = [0, 10];
const ZMAX = 6;
const BANDS = 8;
const round1 = (v: number) => Math.round(v * 10) / 10;

export function Scene({ trace, index, data, reveal, onData }: SceneProps<LogState, LogData>) {
  const t = useT();
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const threshold = s.threshold;
  // Predictions exist once the first guess is made.
  const predicted = frame.codeLine !== "init";
  const trainedOnThis = s.probs.length === data.points.length;

  const shade = useMemo(
    () => regionGrid((x, y) => probability(s, x, y), DOMAIN, DOMAIN, 28),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.w[0], s.w[1], s.b, s.mean[0], s.mean[1], s.std[0], s.std[1]],
  );
  const scale = makeScale(PLOT, DOMAIN, DOMAIN);
  const boundary = boundaryLine(s, threshold);
  let seg: [[number, number], [number, number]] | null = null;
  if (boundary.kind === "line") seg = clipLine(boundary, DOMAIN, DOMAIN);
  else if (boundary.kind === "vertical" && boundary.x >= 0 && boundary.x <= 10)
    seg = [
      [boundary.x, 0],
      [boundary.x, 10],
    ];

  const editable = !!onData && data.presetId === "custom";
  const sig = makeScale(SIG, [-ZMAX, ZMAX], [0, 1]);
  const curve = Array.from({ length: 61 }, (_, k) => {
    const z = -ZMAX + (k / 60) * 2 * ZMAX;
    return `${sig.sx(z).toFixed(1)},${sig.sy(sigmoid(z)).toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("log.scene.label")}>
      <defs>
        <clipPath id="log-plot">
          <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0} />
        </clipPath>
      </defs>
      {show("shade") && predicted && (
        <g data-part="shade" clipPath="url(#log-plot)" pointerEvents="none">
          {shade.cells.map((c, k) => (
            <rect
              key={k}
              className={styles[`p${Math.min(BANDS - 1, Math.floor(c.v * BANDS))}`]}
              x={scale.sx(c.x - shade.size[0] / 2)}
              y={scale.sy(c.y + shade.size[1] / 2)}
              width={scale.sx(shade.size[0]) - scale.sx(0) + 0.6}
              height={scale.sy(0) - scale.sy(shade.size[1]) + 0.6}
            />
          ))}
        </g>
      )}
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("log.axis.x")}
        yLabel={t("log.axis.y")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...data.points, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] }) : undefined}
      >
        {(sc) => (
          <>
            {show("boundary") && predicted && seg && (
              <line
                data-part="boundary"
                className={styles.boundary}
                pointerEvents="none"
                x1={sc.sx(seg[0][0])}
                y1={sc.sy(seg[0][1])}
                x2={sc.sx(seg[1][0])}
                y2={sc.sy(seg[1][1])}
              />
            )}
            {show("points") &&
              data.points.map((p, i) => {
                const wrong = predicted && trainedOnThis && (s.probs[i] >= threshold ? 1 : 0) !== p.c;
                return (
                  <ClassMarker
                      key={i}
                      x={sc.sx(p.x)}
                      y={sc.sy(p.y)}
                      c={p.c}
                      ring={wrong}
                      onClick={editable ? () => onData!({ ...data, points: data.points.filter((_, k) => k !== i) }) : undefined}
                    />
                );
              })}
          </>
        )}
      </Plot2D>

      {show("sigmoid") && (
        <g data-part="sigmoid">
          <text className={styles.caption} x={(SIG.x0 + SIG.x1) / 2} y={30} textAnchor="middle">
            {t("log.scene.sigmoid")}
          </text>
          <path className={styles.axis} d={`M${SIG.x0} ${SIG.y0}V${SIG.y1}H${SIG.x1}`} />
          {[0, 0.5, 1].map((v) => (
            <text key={v} className={styles.tick} x={SIG.x0 - 6} y={sig.sy(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          <text className={styles.tick} x={(SIG.x0 + SIG.x1) / 2} y={SIG.y1 + 30} textAnchor="middle">
            {t("log.scene.score")}
          </text>
          <line className={styles.threshold} x1={SIG.x0} x2={SIG.x1} y1={sig.sy(threshold)} y2={sig.sy(threshold)} />
          <polyline className={styles.curve} points={curve} />
          {predicted &&
            trainedOnThis &&
            data.points.map((p, i) => {
              const z = Math.max(-ZMAX, Math.min(ZMAX, logit(s, p.x, p.y)));
              return <ClassMarker key={i} x={sig.sx(z)} y={sig.sy(sigmoid(z))} c={p.c} r={4.5} />;
            })}
        </g>
      )}
    </svg>
  );
}
