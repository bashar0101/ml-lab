"use client";

import { useId, useState, type FormEvent } from "react";
import { Markdownish } from "@/components/Markdownish";
import { useT } from "@/i18n/ui-context";
import type { LabControlsProps } from "../types";
import { LR_LIMITS, type LrParams } from "./algorithm";
import styles from "./LabControls.module.css";
import { PRESETS } from "./presets";
import type { LrData } from "./Scene";

/** Keyboard-friendly way to add and remove drawn points (the chart itself needs a pointer). */
function PointEditor({ data, onData }: { data: LrData; onData(d: LrData): void }) {
  const t = useT();
  const xId = useId();
  const yId = useId();
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const nx = Number(x);
  const ny = Number(y);
  const valid = x.trim() !== "" && y.trim() !== "" && Number.isFinite(nx) && Number.isFinite(ny);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    // Keep typed points on the drawing grid (x 0–10, y 0–100).
    onData({ ...data, points: [...data.points, { x: Math.min(10, Math.max(0, nx)), y: Math.min(100, Math.max(0, ny)) }] });
    setX("");
    setY("");
  }

  return (
    <div className={styles.points}>
      <form className={styles.addRow} onSubmit={add}>
        <label htmlFor={xId}>{t("lab.pointX")}</label>
        <input id={xId} type="number" step="any" inputMode="decimal" value={x} onChange={(e) => setX(e.target.value)} />
        <label htmlFor={yId}>{t("lab.pointY")}</label>
        <input id={yId} type="number" step="any" inputMode="decimal" value={y} onChange={(e) => setY(e.target.value)} />
        <button type="submit" className={styles.chip} disabled={!valid}>
          {t("lab.addPoint")}
        </button>
      </form>
      {data.points.length > 0 && (
        <ul className={styles.pointList} aria-label={t("lab.points")}>
          {data.points.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className={styles.pointChip}
                aria-label={t("lab.removePoint", { x: p.x, y: p.y })}
                onClick={() => onData({ ...data, points: data.points.filter((_, k) => k !== i) })}
              >
                ({p.x}, {p.y}) <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<LrParams, LrData>) {
  const t = useT();
  const lrId = useId();
  const stepsId = useId();
  const custom = data.presetId === "custom";

  return (
    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label={t("lab.yourData")}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.chip}
            aria-pressed={data.presetId === p.id}
            onClick={() => onData({ presetId: p.id, points: p.points.map((q) => ({ ...q })) })}
          >
            {labels.presets[p.id] ?? p.id}
          </button>
        ))}
        <button
          type="button"
          className={styles.chip}
          aria-pressed={custom}
          onClick={() => onData({ presetId: "custom", points: [] })}
        >
          {t("lab.drawOwn")}
        </button>
      </div>
      {custom && (
        <>
          <p className={styles.hint}>{t("lab.drawHint")}</p>
          <PointEditor data={data} onData={onData} />
        </>
      )}

      <div className={styles.field}>
        <label htmlFor={lrId} className={styles.label}>
          {labels.params.learningRate?.label ?? "learningRate"}
        </label>
        <output className={styles.value} aria-hidden="true">{params.learningRate.toFixed(2)}</output>
        <input
          id={lrId}
          type="range"
          className={styles.range}
          min={LR_LIMITS.learningRate.min}
          max={LR_LIMITS.learningRate.max}
          step={LR_LIMITS.learningRate.step}
          value={params.learningRate}
          onChange={(e) => onParams({ ...params, learningRate: Number(e.target.value) })}
        />
        {labels.params.learningRate?.hint && (
          <p className={styles.hint}>
            <Markdownish text={labels.params.learningRate.hint} inline />
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={stepsId} className={styles.label}>
          {labels.params.steps?.label ?? "steps"}
        </label>
        <output className={styles.value} aria-hidden="true">{params.steps}</output>
        <input
          id={stepsId}
          type="range"
          className={styles.range}
          min={LR_LIMITS.steps.min}
          max={LR_LIMITS.steps.max}
          step={1}
          value={params.steps}
          onChange={(e) => onParams({ ...params, steps: Number(e.target.value) })}
        />
        {labels.params.steps?.hint && (
          <p className={styles.hint}>
            <Markdownish text={labels.params.steps.hint} inline />
          </p>
        )}
      </div>
    </div>
  );
}
