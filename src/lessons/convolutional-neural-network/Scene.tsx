"use client";

import { useT } from "@/i18n/ui-context";
import type { SceneProps } from "../types";
import { KERNELS, type CnnState, type Image } from "./algorithm";
import styles from "./Scene.module.css";

export interface CnnData {
  presetId: string;
  image: Image;
}

const W = 780;
const H = 395;
const IN = { x0: 26, y0: 58, cell: 28 };
const KER = { x0: 284, y0: 58, cell: 26 };
const MAP = { x0: 284, y0: 186, cell: 22 };
const POOL = { x0: 452, y0: 58, cell: 26 };
const PROB = { x0: 600, x1: 760, y0: 58, row: 27 };

/** Value → colour band: negative peach … positive lavender. */
const tone = (v: number, scale: number) => Math.max(0, Math.min(6, Math.round((Math.tanh(v / scale) + 1) * 3)));
const fmt = (v: number) => (Math.abs(v) < 10 ? v.toFixed(1) : v.toFixed(0));

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<CnnState, CnnData>) {
  const t = useT();
  const show = (part: string) => (!stale || part === "image") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const image = data.image;
  const K = KERNELS[s.filter];
  const after = ["relu", "pool", "maps", "dense", "done"].includes(s.phase);
  const map = after ? s.relu[s.filter] : s.conv[s.filter];
  const best = s.probs.indexOf(Math.max(...s.probs));

  const toggle = (r: number, c: number) =>
    onData?.({ presetId: "custom", image: image.map((row, i) => row.map((v, j) => (i === r && j === c ? 1 - v : v))) });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("cnn.scene.label")}>
      {show("image") && (
        <g>
          <text className={styles.caption} x={IN.x0} y={IN.y0 - 12}>
            {t("cnn.scene.image")}
          </text>
          {image.map((row, r) =>
            row.map((v, c) => (
              <g key={`${r}-${c}`} data-part="pixel" onClick={onData ? () => toggle(r, c) : undefined} className={onData ? styles.clickable : undefined}>
                <rect className={v ? styles.on : styles.off} x={IN.x0 + c * IN.cell} y={IN.y0 + r * IN.cell} width={IN.cell} height={IN.cell} />
                <text className={v ? styles.numOn : styles.numOff} x={IN.x0 + c * IN.cell + IN.cell / 2} y={IN.y0 + r * IN.cell + IN.cell / 2 + 4} textAnchor="middle">
                  {v}
                </text>
              </g>
            )),
          )}
          {show("window") && s.pos && (
            <rect
              data-part="window"
              className={styles.window}
              x={IN.x0 + s.pos.c * IN.cell}
              y={IN.y0 + s.pos.r * IN.cell}
              width={3 * IN.cell}
              height={3 * IN.cell}
              pointerEvents="none"
            />
          )}
        </g>
      )}

      {show("kernel") && s.phase !== "init" && (
        <g>
          <text className={styles.caption} x={KER.x0} y={KER.y0 - 12}>
            {t("cnn.scene.kernel", { n: s.filter + 1 })}
          </text>
          {K.map((row, r) =>
            row.map((v, c) => (
              <g key={`${r}-${c}`}>
                <rect className={styles[`t${tone(v, 1)}`]} x={KER.x0 + c * KER.cell} y={KER.y0 + r * KER.cell} width={KER.cell} height={KER.cell} />
                <text className={styles.small} x={KER.x0 + c * KER.cell + KER.cell / 2} y={KER.y0 + r * KER.cell + KER.cell / 2 + 3.5} textAnchor="middle">
                  {fmt(v)}
                </text>
              </g>
            )),
          )}
        </g>
      )}

      {show("featuremap") && s.phase !== "init" && (
        <g>
          <text className={styles.caption} x={MAP.x0} y={MAP.y0 - 10}>
            {t(after ? "cnn.scene.relu" : "cnn.scene.map")}
          </text>
          {map.map((row, r) =>
            row.map((v, c) => {
              const filled = r * 6 + c < s.revealed;
              return (
                <g key={`${r}-${c}`} data-part="feature-cell" data-filled={filled}>
                  <rect
                    className={filled ? styles[`t${tone(v, 2)}`] : styles.empty}
                    x={MAP.x0 + c * MAP.cell}
                    y={MAP.y0 + r * MAP.cell}
                    width={MAP.cell}
                    height={MAP.cell}
                  />
                  {filled && (
                    <text className={styles.tiny} x={MAP.x0 + c * MAP.cell + MAP.cell / 2} y={MAP.y0 + r * MAP.cell + MAP.cell / 2 + 3} textAnchor="middle">
                      {fmt(v)}
                    </text>
                  )}
                </g>
              );
            }),
          )}
          {s.pos && (
            <rect className={styles.window} x={MAP.x0 + s.pos.c * MAP.cell} y={MAP.y0 + s.pos.r * MAP.cell} width={MAP.cell} height={MAP.cell} pointerEvents="none" />
          )}
        </g>
      )}

      {show("pooled") && (s.phase === "pool" || s.phase === "maps" || s.phase === "dense" || s.phase === "done") && (
        <g>
          <text className={styles.caption} x={POOL.x0} y={POOL.y0 - 12}>
            {t(s.phase === "pool" ? "cnn.scene.pooled" : "cnn.scene.allMaps")}
          </text>
          {(s.phase === "pool" ? [s.filter] : [0, 1, 2, 3]).map((f, k) => {
            const cell = s.phase === "pool" ? POOL.cell : 17;
            const ox = POOL.x0 + (s.phase === "pool" ? 0 : (k % 2) * 62);
            const oy = POOL.y0 + (s.phase === "pool" ? 0 : Math.floor(k / 2) * 66);
            return (
              <g key={f} data-part="pooled-map">
                {s.pooled[f].map((row, r) =>
                  row.map((v, c) => <rect key={`${r}-${c}`} className={styles[`t${tone(v, 2)}`]} x={ox + c * cell} y={oy + r * cell} width={cell} height={cell} />),
                )}
                {s.phase !== "pool" && (
                  <text className={styles.tiny} x={ox} y={oy + 3 * cell + 11}>
                    {t("cnn.scene.filter", { n: f + 1 })}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {show("probs") && (s.phase === "dense" || s.phase === "done") && (
        <g>
          <text className={styles.caption} x={PROB.x0} y={PROB.y0 - 12}>
            {t("cnn.scene.probs")}
          </text>
          {s.probs.map((p, d) => (
            <g key={d} data-part="prob-bar">
              <text className={styles.digit} x={PROB.x0} y={PROB.y0 + d * PROB.row + 14}>
                {d}
              </text>
              <rect className={styles.barBack} x={PROB.x0 + 16} y={PROB.y0 + d * PROB.row + 3} width={PROB.x1 - PROB.x0 - 56} height={14} rx={3} />
              <rect className={d === best ? styles.barBest : styles.bar} x={PROB.x0 + 16} y={PROB.y0 + d * PROB.row + 3} width={Math.max(1, (PROB.x1 - PROB.x0 - 56) * p)} height={14} rx={3} />
              <text className={styles.tiny} x={PROB.x1 - 34} y={PROB.y0 + d * PROB.row + 14}>
                {Math.round(p * 100)}%
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
