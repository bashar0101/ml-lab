"use client";

import { useT } from "@/i18n/ui-context";
import type { SceneProps } from "../types";
import type { RnnState } from "./algorithm";
import styles from "./Scene.module.css";

export interface RnnData {
  presetId: string;
  text: string;
}

const W = 780;
const H = 395;
const STRIP = { x0: 30, x1: 750, y0: 56 };
const GAUGE = { x0: 40, x1: 380, y: 300 };
const CHART = { x0: 470, x1: 750, y0: 270, y1: 360 };

const tone = (v: number) => Math.max(0, Math.min(6, Math.round((v + 1) * 3)));

export function Scene({ trace, index, data, reveal, stale }: SceneProps<RnnState, RnnData>) {
  const t = useT();
  const show = (part: string) => (!stale || part === "letters") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const text = stale ? data.text : s.text;
  const n = Math.max(1, text.length);
  const cw = Math.min(64, (STRIP.x1 - STRIP.x0) / n);
  const sq = Math.max(3, Math.min(14, cw - 6));
  const hiddenTop = STRIP.y0 + 26;
  const letterY = hiddenTop + 6 * sq + 16;
  const fontSize = Math.max(8, Math.min(16, cw * 0.45));
  const col = (k: number) => STRIP.x0 + k * cw + cw / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("rnn.scene.label")}>
      <text className={styles.caption} x={STRIP.x0} y={STRIP.y0}>
        {t("rnn.scene.strip")}
      </text>
      {[...text].map((ch, k) => {
        const read = !stale && k < s.step;
        const current = !stale && k === s.step - 1;
        const h = read ? s.hidden[k + 1] : null;
        return (
          <g key={k}>
            {k > 0 && show("hidden") && (
              <line className={read ? styles.arrow : styles.arrowFaint} x1={col(k - 1) + sq / 2 + 1} x2={col(k) - sq / 2 - 1} y1={hiddenTop + 3 * sq} y2={hiddenTop + 3 * sq} />
            )}
            {show("hidden") && (
              <g data-part="hidden" data-read={read}>
                {Array.from({ length: 6 }, (_, j) => (
                  <rect key={j} className={h ? styles[`t${tone(h[j])}`] : styles.empty} x={col(k) - sq / 2} y={hiddenTop + j * sq} width={sq} height={sq} />
                ))}
                {current && <rect className={styles.current} x={col(k) - sq / 2 - 3} y={hiddenTop - 3} width={sq + 6} height={6 * sq + 6} rx={3} />}
              </g>
            )}
            <text data-part="letter" className={read ? styles.letterRead : styles.letter} x={col(k)} y={letterY + fontSize} fontSize={fontSize} textAnchor="middle">
              {ch}
            </text>
            {k === 0 && (
              <text className={styles.tiny} x={col(k)} y={letterY + fontSize + 14} textAnchor="middle">
                {t("rnn.scene.first")}
              </text>
            )}
          </g>
        );
      })}

      {show("answer") && s.answered && (
        <g data-part="answer">
          <text className={styles.caption} x={GAUGE.x0} y={GAUGE.y - 14}>
            {t("rnn.scene.answer")}
          </text>
          <rect className={styles.barBack} x={GAUGE.x0} y={GAUGE.y} width={GAUGE.x1 - GAUGE.x0} height={18} rx={4} />
          <rect className={styles.bar} x={GAUGE.x0} y={GAUGE.y} width={(GAUGE.x1 - GAUGE.x0) * s.prob} height={18} rx={4} />
          <text className={styles.value} x={GAUGE.x0} y={GAUGE.y + 40}>
            {t(s.prob >= 0.5 ? "rnn.scene.saysA" : "rnn.scene.saysB", { pct: Math.round(s.prob * 100) })}
          </text>
        </g>
      )}

      {show("chart") && (
        <g>
          <text className={styles.caption} x={CHART.x0} y={CHART.y0 - 16}>
            {t("rnn.scene.chart", { memory: s.memory })}
          </text>
          <path className={styles.axis} d={`M${CHART.x0} ${CHART.y0}V${CHART.y1}H${CHART.x1}`} />
          {s.chart.map((c, k) => {
            const x = CHART.x0 + 16 + (k * (CHART.x1 - CHART.x0 - 32)) / (s.chart.length - 1);
            const y = CHART.y1 - c.accuracy * (CHART.y1 - CHART.y0);
            return (
              <g key={c.length} data-part="chart-point">
                <line className={styles.stem} x1={x} x2={x} y1={CHART.y1} y2={y} />
                <circle className={styles.dot} cx={x} cy={y} r={4} />
                <text className={styles.tiny} x={x} y={CHART.y1 + 14} textAnchor="middle">
                  {c.length}
                </text>
              </g>
            );
          })}
          <line className={styles.chance} x1={CHART.x0} x2={CHART.x1} y1={CHART.y1 - 0.5 * (CHART.y1 - CHART.y0)} y2={CHART.y1 - 0.5 * (CHART.y1 - CHART.y0)} />
          <text className={styles.tiny} x={CHART.x0 - 6} y={CHART.y1 - 0.5 * (CHART.y1 - CHART.y0) + 3} textAnchor="end">
            {t("rnn.scene.coin")}
          </text>
        </g>
      )}
    </svg>
  );
}
