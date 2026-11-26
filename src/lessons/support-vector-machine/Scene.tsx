"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import type { ClassData } from "../shared/ClassDataControls";
import { contourSegments } from "../shared/contours";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import { decision, type SvmState } from "./algorithm";
import styles from "./Scene.module.css";

export type SvmData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const STRIP = { x0: 470, x1: 750, y0: 70, y1: 330 };
const DOMAIN: [number, number] = [0, 10];
const M_RANGE: [number, number] = [-2, 3];
const round1 = (v: number) => Math.round(v * 10) / 10;

export function Scene({ trace, index, data, reveal, onData }: SceneProps<SvmState, SvmData>) {
  const t = useT();
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const pts = data.points;
  const fits = s.alpha.length === pts.length;
  const trained = fits && s.scale > 0;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const editable = !!onData && data.presetId === "custom";

  const geometry = useMemo(() => {
    if (!trained) return null;
    const cache = new Map<string, number>();
    const f = (x: number, y: number) => {
      const key = `${x.toFixed(6)},${y.toFixed(6)}`;
      let v = cache.get(key);
      if (v === undefined) {
        v = decision(s, pts, x, y);
        cache.set(key, v);
      }
      return v;
    };
    return {
      shade: regionGrid((x, y) => (f(x, y) >= 0 ? 1 : 0), DOMAIN, DOMAIN, 28),
      boundary: contourSegments(f, DOMAIN, DOMAIN, 36, 0),
      plus: contourSegments(f, DOMAIN, DOMAIN, 36, 1),
      minus: contourSegments(f, DOMAIN, DOMAIN, 36, -1),
    };
    // A frame's state never changes, so it is the right memo key.
  }, [s, pts, trained]);

  const segs = (list: [number, number][][]) =>
    list.map((g, k) => <line key={k} x1={sc.sx(g[0][0])} y1={sc.sy(g[0][1])} x2={sc.sx(g[1][0])} y2={sc.sy(g[1][1])} />);

  const strip = makeScale(STRIP, M_RANGE, [0, 1]);
  const picked = new Set(fits ? s.picked : []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("svm.scene.label")}>
      <defs>
        <clipPath id="svm-plot">
          <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0} />
        </clipPath>
      </defs>
      {show("shade") && geometry && (
        <g data-part="shade" clipPath="url(#svm-plot)" pointerEvents="none">
          {geometry.shade.cells.map((c, k) => (
            <rect
              key={k}
              className={c.v ? styles.side1 : styles.side0}
              x={sc.sx(c.x - geometry.shade.size[0] / 2)}
              y={sc.sy(c.y + geometry.shade.size[1] / 2)}
              width={sc.sx(geometry.shade.size[0]) - sc.sx(0) + 0.6}
              height={sc.sy(0) - sc.sy(geometry.shade.size[1]) + 0.6}
            />
          ))}
        </g>
      )}
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("svm.axis.x")}
        yLabel={t("svm.axis.y")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] }) : undefined}
      >
        {() => (
          <g clipPath="url(#svm-plot)" pointerEvents="none">
            {show("margins") && geometry && (
              <>
                <g data-part="margin" className={styles.margin}>
                  {segs(geometry.plus)}
                </g>
                <g data-part="margin" className={styles.margin}>
                  {segs(geometry.minus)}
                </g>
              </>
            )}
            {show("boundary") && geometry && (
              <g data-part="boundary" className={styles.boundary}>
                {segs(geometry.boundary)}
              </g>
            )}
          </g>
        )}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => (
          <g key={i}>
            {show("support") && trained && s.margins[i] <= 1 + 1e-9 && (
              <circle data-part="support" className={styles.support} cx={sc.sx(p.x)} cy={sc.sy(p.y)} r={11} pointerEvents="none" />
            )}
            {picked.has(i) && <circle data-part="picked" className={styles.picked} cx={sc.sx(p.x)} cy={sc.sy(p.y)} r={13} pointerEvents="none" />}
            <ClassMarker
              x={sc.sx(p.x)}
              y={sc.sy(p.y)}
              c={p.c}
              ring={trained && s.margins[i] < 0}
              onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined}
            />
          </g>
        ))}

      {show("strip") && trained && (
        <g data-part="strip">
          <text className={styles.caption} x={(STRIP.x0 + STRIP.x1) / 2} y={STRIP.y0 - 30} textAnchor="middle">
            {t("svm.scene.strip")}
          </text>
          <rect className={styles.street} x={strip.sx(0)} y={STRIP.y0 - 10} width={strip.sx(1) - strip.sx(0)} height={STRIP.y1 - STRIP.y0 + 10} />
          <rect className={styles.wrongZone} x={STRIP.x0} y={STRIP.y0 - 10} width={strip.sx(0) - STRIP.x0} height={STRIP.y1 - STRIP.y0 + 10} />
          <path className={styles.axis} d={`M${STRIP.x0} ${STRIP.y1}H${STRIP.x1}`} />
          {[-2, -1, 0, 1, 2, 3].map((v) => (
            <text key={v} className={styles.tick} x={strip.sx(v)} y={STRIP.y1 + 16} textAnchor="middle">
              {v}
            </text>
          ))}
          <text className={styles.tick} x={strip.sx(-1)} y={STRIP.y0 - 14} textAnchor="middle">
            {t("svm.scene.wrong")}
          </text>
          <text className={styles.tick} x={strip.sx(0.5)} y={STRIP.y0 - 14} textAnchor="middle">
            {t("svm.scene.street")}
          </text>
          <text className={styles.tick} x={strip.sx(2)} y={STRIP.y0 - 14} textAnchor="middle">
            {t("svm.scene.safe")}
          </text>
          {pts.map((p, i) => {
            const m = Math.max(M_RANGE[0] + 0.05, Math.min(M_RANGE[1] - 0.05, s.margins[i]));
            const row = ((i * 37) % pts.length) / pts.length;
            return <ClassMarker key={i} x={strip.sx(m)} y={STRIP.y0 + 6 + row * (STRIP.y1 - STRIP.y0 - 16)} c={p.c} r={4.5} />;
          })}
        </g>
      )}
    </svg>
  );
}
