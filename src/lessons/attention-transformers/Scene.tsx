"use client";

import { useT } from "@/i18n/ui-context";
import type { SceneProps } from "../types";
import { FEATURES, tokenize, type AttnStage, type AttnState } from "./algorithm";
import styles from "./Scene.module.css";

export interface AttnData {
  presetId: string;
  text: string;
}

const W = 780;
const H = 440;
const ROW = { x0: 30, x1: 750, y: 128, h: 30 };
const VEC = { label: 30, x0: 100, cell: 36, h: 26 };
const MAP = { x0: 486, size: 124, gap: 16, y: 262 };
const ORDER: AttnStage[] = ["init", "embed", "scores", "softmax", "mix", "all", "done"];

/** Diverging fill: peach for negative, lavender for positive, scaled by the row's largest value. */
const tone = (v: number, max: number) => Math.max(0, Math.min(6, Math.round((v / (max || 1) + 1) * 3)));
const heat = (w: number) => Math.max(0, Math.min(5, Math.ceil(w * 5 - 1e-9)));
const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0" : String(Number(v.toFixed(2))));

export function Scene({ trace, index, data, reveal, stale }: SceneProps<AttnState, AttnData>) {
  const t = useT();
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const at = (stage: AttnStage) => !stale && ORDER.indexOf(s.stage) >= ORDER.indexOf(stage);
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const tokens = stale ? tokenize(data.text) : s.tokens;
  const n = Math.max(1, tokens.length);
  const slot = (ROW.x1 - ROW.x0) / n;
  const cx = (k: number) => ROW.x0 + slot * k + slot / 2;
  const sel = stale ? -1 : s.word;
  const word = stale ? "" : s.tokens[s.word];
  const headName = t(s.head === 0 ? "attn.head1" : "attn.head2");

  const vectorRow = (label: string, values: number[], y: number, part: string, max = Math.max(...values.map(Math.abs))) => (
    <g data-part={part}>
      <text className={styles.rowLabel} x={VEC.label} y={y + VEC.h / 2 + 4}>
        {label}
      </text>
      {values.map((v, j) => (
        <g key={j}>
          <rect className={styles[`t${tone(v, max)}`]} x={VEC.x0 + j * VEC.cell} y={y} width={VEC.cell - 3} height={VEC.h} rx={3} />
          <text className={styles.cellText} x={VEC.x0 + j * VEC.cell + (VEC.cell - 3) / 2} y={y + VEC.h / 2 + 4} textAnchor="middle">
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("attn.scene.label")}>
      {!stale && (
        <text className={styles.caption} x={ROW.x0} y={22}>
          {t("attn.scene.question", { word, head: headName })}
          {!s.positions && <tspan className={styles.warn}> {t("attn.scene.noPositions")}</tspan>}
        </text>
      )}

      {show("arcs") && at("softmax") &&
        s.weights.map((w, j) => {
          if (j === sel) return null;
          const lift = Math.min(84, 22 + 9 * Math.abs(j - sel));
          const x0 = cx(sel);
          const x1 = cx(j);
          return (
            <path
              key={j}
              data-part="arc"
              className={styles.arc}
              d={`M${x0} ${ROW.y - 4} Q${(x0 + x1) / 2} ${ROW.y - 4 - 2 * lift} ${x1} ${ROW.y - 4}`}
              strokeWidth={1 + 9 * w}
              strokeOpacity={0.12 + 0.88 * w}
            />
          );
        })}

      {tokens.map((w, k) => (
        <g key={k}>
          <rect
            data-part="token"
            data-selected={k === sel}
            className={k === sel ? styles.tokenSel : styles.token}
            x={ROW.x0 + slot * k + 3}
            y={ROW.y}
            width={slot - 6}
            height={ROW.h}
            rx={6}
          />
          <text className={styles.tokenText} x={cx(k)} y={ROW.y + ROW.h / 2 + 5} textAnchor="middle" fontSize={Math.min(14, slot / 4)}>
            {w}
          </text>
          {show("scores") && at("scores") && !at("softmax") && (
            <text data-part="score" className={styles.num} x={cx(k)} y={ROW.y + ROW.h + 22} textAnchor="middle">
              {s.scores[k].toFixed(2)}
            </text>
          )}
          {show("arcs") && at("softmax") && (
            <g data-part="weight">
              <rect className={styles.weightBar} x={cx(k) - 7} y={ROW.y + ROW.h + 40 - 34 * s.weights[k]} width={14} height={34 * s.weights[k]} />
              <text className={styles.num} x={cx(k)} y={ROW.y + ROW.h + 56} textAnchor="middle">
                {Math.round(s.weights[k] * 100)}%
              </text>
            </g>
          )}
        </g>
      ))}

      {show("vectors") && at("embed") && (
        <g>
          {FEATURES.map((f, j) => (
            <text key={f} className={styles.tiny} x={VEC.x0 + j * VEC.cell + (VEC.cell - 3) / 2} y={MAP.y - 10} textAnchor="middle">
              {t(`attn.feature.${f}`)}
            </text>
          ))}
          {vectorRow(t("attn.scene.meaning", { word }), s.x.slice(0, FEATURES.length), MAP.y, "vector", 1)}
          {at("mix") && vectorRow(t("attn.scene.output"), s.out, MAP.y + 34, "output", 1)}
          {vectorRow(t("attn.scene.position"), s.x.slice(FEATURES.length), MAP.y + 84, "vector", 1)}
          {at("scores") && vectorRow(t("attn.scene.query"), s.q, MAP.y + 118, "vector")}
          {at("scores") && (
            <text className={styles.tiny} x={VEC.x0} y={MAP.y + 164}>
              {t("attn.scene.formula")}
            </text>
          )}
        </g>
      )}

      {show("matrix") && at("all") &&
        s.matrices.map((m, h) => {
          const x0 = MAP.x0 + h * (MAP.size + MAP.gap);
          const c = MAP.size / n;
          return (
            <g key={h} data-part="matrix" data-head={h + 1}>
              <text className={h === s.head ? styles.mapTitleSel : styles.mapTitle} x={x0} y={MAP.y - 10}>
                {t(h === 0 ? "attn.head1" : "attn.head2")}
              </text>
              {m.map((row, i) =>
                row.map((w, j) => (
                  <rect key={`${i}-${j}`} data-part="cell" className={styles[`h${heat(w)}`]} x={x0 + j * c} y={MAP.y + i * c} width={c} height={c}>
                    <title>{`${s.tokens[i]} → ${s.tokens[j]}: ${Math.round(w * 100)}%`}</title>
                  </rect>
                )),
              )}
              <rect className={styles.mapFrame} x={x0} y={MAP.y} width={MAP.size} height={MAP.size} />
              {h === s.head && <rect className={styles.rowSel} x={x0 - 2} y={MAP.y + sel * c - 1} width={MAP.size + 4} height={c + 2} rx={2} />}
            </g>
          );
        })}
      {show("matrix") && at("all") && (
        <text className={styles.tiny} x={MAP.x0} y={MAP.y + MAP.size + 18}>
          {t("attn.scene.matrix")}
        </text>
      )}
    </svg>
  );
}
