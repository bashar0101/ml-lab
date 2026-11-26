"use client";

import { useT } from "@/i18n/ui-context";
import { niceDomain } from "../shared/axes";
import type { ClassData } from "../shared/ClassDataControls";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import type { SceneProps } from "../types";
import { varianceAlong, type PcaState } from "./algorithm";
import styles from "./Scene.module.css";

export type PcaData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const CURVE = { x0: 470, y0: 60, x1: 750, y1: 280 };
const BAR = { x0: 470, x1: 750, y: 330 };
const DOMAIN: [number, number] = [0, 10];
const round1 = (v: number) => Math.round(v * 10) / 10;
const unit = (deg: number): [number, number] => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<PcaState, PcaData>) {
  const t = useT();
  const show = (part: string) => (!stale || part === "points") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const pts = data.points;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const editable = !!onData && data.presetId === "custom";
  const [mx, my] = s.mean;
  const sweeping = frame.event === "sweep";
  const squash = s.projected && s.components === 1;

  const project = (deg: number, p: { x: number; y: number }) => {
    const [ux, uy] = unit(deg);
    const d = (p.x - mx) * ux + (p.y - my) * uy;
    return { x: mx + d * ux, y: my + d * uy };
  };
  const lineThrough = (deg: number) => {
    const [ux, uy] = unit(deg);
    return { x1: sc.sx(mx - 20 * ux), y1: sc.sy(my - 20 * uy), x2: sc.sx(mx + 20 * ux), y2: sc.sy(my + 20 * uy) };
  };

  // Right-hand curve: variance along every direction tried so far.
  const full = Array.from({ length: 31 }, (_, k) => varianceAlong(s.cov, k * 6));
  const yAxis = niceDomain([0, ...full.filter(Number.isFinite)], 4);
  const cs = makeScale(CURVE, [0, 180], yAxis.domain);
  const total = s.lambda1 + s.lambda2;
  const kept = total > 0 ? (s.components === 2 ? 1 : s.lambda1 / total) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("pca.scene.label")}>
      <defs>
        <clipPath id="pca-plot">
          <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0} />
        </clipPath>
        <marker id="pca-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className={styles.arrowHead} />
        </marker>
      </defs>
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("dt.feature.0")}
        yLabel={t("dt.feature.1")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] }) : undefined}
      >
        {() => (
          <g clipPath="url(#pca-plot)" pointerEvents="none">
            {show("direction") && s.angle !== null && !s.found && <line data-part="direction" className={styles.direction} {...lineThrough(s.angle)} />}
            {show("direction") &&
              sweeping &&
              s.angle !== null &&
              pts.map((p, i) => {
                const q = project(s.angle!, p);
                return <line key={i} data-part="projection" className={styles.shadow} x1={sc.sx(p.x)} y1={sc.sy(p.y)} x2={sc.sx(q.x)} y2={sc.sy(q.y)} />;
              })}
            {show("axes") &&
              s.found > 0 &&
              [s.pc1Angle, (s.pc1Angle + 90) % 180].slice(0, s.found).map((deg, k) => {
                const len = 2 * Math.sqrt(k === 0 ? s.lambda1 : s.lambda2);
                const [ux, uy] = unit(deg);
                return (
                  <g key={k} data-part="axis">
                    <line className={k === 0 ? styles.pc1Line : styles.pc2Line} {...lineThrough(deg)} />
                    {len > 0 && (
                      <line
                        className={k === 0 ? styles.pc1 : styles.pc2}
                        x1={sc.sx(mx)}
                        y1={sc.sy(my)}
                        x2={sc.sx(mx + len * ux)}
                        y2={sc.sy(my + len * uy)}
                        markerEnd="url(#pca-arrow)"
                      />
                    )}
                    <text className={styles.axisLabel} x={sc.sx(mx + (len + 0.5) * ux)} y={sc.sy(my + (len + 0.5) * uy)}>
                      {t(k === 0 ? "pca.scene.pc1" : "pca.scene.pc2")}
                    </text>
                  </g>
                );
              })}
          </g>
        )}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => {
          const q = show("project") && squash ? project(s.pc1Angle, p) : null;
          return (
            <g key={i}>
              <ClassMarker
                x={sc.sx(p.x)}
                y={sc.sy(p.y)}
                c={p.c}
                r={5}
                dim={!!q}
                onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined}
              />
              {q && (
                <g data-part="projected" pointerEvents="none">
                  <line className={styles.shadow} x1={sc.sx(p.x)} y1={sc.sy(p.y)} x2={sc.sx(q.x)} y2={sc.sy(q.y)} />
                  <ClassMarker x={sc.sx(q.x)} y={sc.sy(q.y)} c={p.c} r={4.5} />
                </g>
              )}
            </g>
          );
        })}
      {show("center") && s.centred && (
        <g data-part="mean" pointerEvents="none" transform={`translate(${sc.sx(mx)} ${sc.sy(my)})`}>
          <circle className={styles.mean} r={6} />
          <path className={styles.meanCross} d="M-4 0H4M0 -4V4" />
        </g>
      )}

      {show("curve") && s.curve.length > 0 && (
        <g data-part="curve">
          <text className={styles.caption} x={(CURVE.x0 + CURVE.x1) / 2} y={36} textAnchor="middle">
            {t("pca.scene.curve")}
          </text>
          <path className={styles.axis} d={`M${CURVE.x0} ${CURVE.y0}V${CURVE.y1}H${CURVE.x1}`} />
          {yAxis.ticks.map((v) => (
            <text key={v} className={styles.tick} x={CURVE.x0 - 6} y={cs.sy(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          {[0, 45, 90, 135, 180].map((d) => (
            <text key={d} className={styles.tick} x={cs.sx(d)} y={CURVE.y1 + 16} textAnchor="middle">
              {d}°
            </text>
          ))}
          <polyline className={styles.curveLine} points={s.curve.map((c) => `${cs.sx(c.angle)},${cs.sy(c.variance)}`).join(" ")} />
          {s.curve.map((c, k) => (
            <circle key={k} data-part="curve-point" className={styles.curveDot} cx={cs.sx(c.angle)} cy={cs.sy(c.variance)} r={2.5} />
          ))}
          {s.found > 0 && <line className={styles.pc1Mark} x1={cs.sx(s.pc1Angle)} x2={cs.sx(s.pc1Angle)} y1={CURVE.y0} y2={CURVE.y1} />}
          {s.found > 1 && (
            <line className={styles.pc2Mark} x1={cs.sx((s.pc1Angle + 90) % 180)} x2={cs.sx((s.pc1Angle + 90) % 180)} y1={CURVE.y0} y2={CURVE.y1} />
          )}
          {s.angle !== null && <circle className={styles.current} cx={cs.sx(s.angle)} cy={cs.sy(varianceAlong(s.cov, s.angle))} r={6} />}
        </g>
      )}
      {show("project") && s.found > 0 && total > 0 && (
        <g data-part="explained">
          <text className={styles.caption} x={BAR.x0} y={BAR.y - 10}>
            {t("pca.scene.kept", { pct: Math.round(kept * 100) })}
          </text>
          <rect className={styles.barBack} x={BAR.x0} y={BAR.y} width={BAR.x1 - BAR.x0} height={12} rx={4} />
          <rect className={styles.barFill} x={BAR.x0} y={BAR.y} width={(BAR.x1 - BAR.x0) * kept} height={12} rx={4} />
        </g>
      )}
    </svg>
  );
}
