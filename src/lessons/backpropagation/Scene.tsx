"use client";

import { useT } from "@/i18n/ui-context";
import type { ClassData } from "../shared/ClassDataControls";
import type { SceneProps } from "../types";
import type { BackpropState } from "./algorithm";
import styles from "./Scene.module.css";

export type BackpropData = ClassData;

const W = 780;
const H = 395;
const NET = { x0: 30, x1: 520, y0: 70, y1: 350 };
const INFO = { x0: 560, x1: 760 };
const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toExponential(1) : v.toFixed(2));

export function Scene({ trace, index, reveal, stale }: SceneProps<BackpropState, BackpropData>) {
  const t = useT();
  const show = (part: string) => !stale && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const net = s.net;
  const sizes = net.sizes;
  const L = net.W.length;
  const pos = (l: number, j: number) => {
    const x = NET.x0 + ((NET.x1 - NET.x0) * (l + 0.5)) / sizes.length;
    const gap = Math.min(78, (NET.y1 - NET.y0) / Math.max(...sizes));
    return { x, y: (NET.y0 + NET.y1) / 2 + (j - (sizes[l] - 1) / 2) * gap };
  };
  const r = 19;
  const edgeCount = net.W.flat(2).length;
  const labelEdges = edgeCount <= 15;
  const backward = frame.event === "backward" || s.showGrads;
  const blameLayer = (l: number) => l >= 1 && L - (l - 1) <= s.shownBackward; // activation layer l ↔ weight layer l-1
  const history = s.history;
  const latest = history.at(-1);
  const firstEpoch = history[0];
  // log scale: 1e-5 … 1 (clamped so a huge gradient stays inside the picture)
  const barWidth = (g: number) => Math.max(2, ((Math.log10(Math.min(1, Math.max(g, 1e-5))) + 5) / 5) * (INFO.x1 - INFO.x0 - 60));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("bp.scene.label")}>
      <defs>
        <marker id="bp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className={styles.flowHead} />
        </marker>
      </defs>
      {show("network") && (
        <g>
          {(frame.event === "forward" || frame.event === "backward") && (
            <g>
              <line
                className={frame.event === "forward" ? styles.flowFwd : styles.flowBwd}
                x1={frame.event === "forward" ? NET.x0 + 30 : NET.x1 - 30}
                x2={frame.event === "forward" ? NET.x1 - 30 : NET.x0 + 30}
                y1={36}
                y2={36}
                markerEnd="url(#bp-arrow)"
              />
              <text className={styles.caption} x={(NET.x0 + NET.x1) / 2} y={28} textAnchor="middle">
                {t(frame.event === "forward" ? "bp.scene.forward" : "bp.scene.backward")}
              </text>
            </g>
          )}
          {net.W.map((layer, l) =>
            layer.map((row, j) =>
              row.map((w, i) => {
                const a = pos(l, i);
                const b = pos(l + 1, j);
                const g = s.grad.dW[l]?.[j]?.[i] ?? 0;
                return (
                  <g key={`${l}-${j}-${i}`}>
                    <line
                      className={w >= 0 ? styles.edgePos : styles.edgeNeg}
                      strokeWidth={0.7 + 3 * Math.min(1, Math.abs(w) / 2)}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                    />
                    {show("grads") && s.showGrads && !s.updated && (
                      <g data-part="edge-grad">
                        {labelEdges && (
                          <text className={styles.edgeGrad} x={a.x + (b.x - a.x) * 0.62} y={a.y + (b.y - a.y) * 0.62 - 3} textAnchor="middle">
                            {fmt(g)}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              }),
            ),
          )}
          {sizes.map((n, l) =>
            Array.from({ length: n }, (_, j) => {
              const { x, y } = pos(l, j);
              const value = l <= s.shownForward ? s.fwd.a[l][j] : null;
              const blame = show("blame") && backward && blameLayer(l) ? s.grad.dz[l - 1][j] : null;
              return (
                <g key={`${l}-${j}`}>
                  <circle className={value === null ? styles.nodeEmpty : styles.node} cx={x} cy={y} r={r} />
                  {show("values") && value !== null && (
                    <text data-part="value" className={styles.value} x={x} y={y + 4} textAnchor="middle">
                      {fmt(value)}
                    </text>
                  )}
                  {blame !== null && (
                    <g data-part="blame">
                      <rect className={styles.blameBox} x={x - 24} y={y + r + 4} width={48} height={16} rx={4} />
                      <text className={styles.blame} x={x} y={y + r + 16} textAnchor="middle">
                        δ {fmt(blame)}
                      </text>
                    </g>
                  )}
                </g>
              );
            }),
          )}
        </g>
      )}

      <g className={styles.info}>
        <text className={styles.caption} x={INFO.x0} y={36}>
          {t("bp.scene.example")}
        </text>
        <text x={INFO.x0} y={60}>
          {t("bp.scene.target", { y: s.y })}
        </text>
        {s.shownForward >= L && (
          <text x={INFO.x0} y={80}>
            {t("bp.scene.prediction", { p: fmt(s.fwd.a[L][0]) })}
          </text>
        )}
        {frame.event !== "init" && frame.event !== "forward" && (
          <text x={INFO.x0} y={100}>
            {t("bp.scene.loss", { loss: fmt(frame.metrics.loss) })}
          </text>
        )}
        {show("chart") && latest && (
          <g>
            <text className={styles.caption} x={INFO.x0} y={150}>
              {t("bp.scene.chart", { epoch: history.length })}
            </text>
            {latest.map((g, l) => {
              const y = 166 + l * 26;
              return (
                <g key={l} data-part="grad-bar">
                  <text className={styles.tick} x={INFO.x0} y={y + 12}>
                    {t("bp.scene.layer", { n: l + 1 })}
                  </text>
                  <rect className={styles.bar} x={INFO.x0 + 56} y={y + 3} width={barWidth(g)} height={10} rx={3} />
                  <rect data-part="grad-ghost" className={styles.ghost} x={INFO.x0 + 56} y={y} width={barWidth(firstEpoch[l])} height={16} rx={3} />
                </g>
              );
            })}
            <text className={styles.tick} x={INFO.x0} y={166 + latest.length * 26 + 14}>
              {t("bp.scene.ghost")}
            </text>
            <text className={styles.tick} x={INFO.x0} y={166 + latest.length * 26 + 28}>
              {t("bp.scene.logScale")}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
