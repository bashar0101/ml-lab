"use client";

import { useId } from "react";
import { Markdownish } from "@/components/Markdownish";
import { useT } from "@/i18n/ui-context";
import type { LabControlsProps } from "../types";
import { LR_LIMITS, type LrParams } from "./algorithm";
import styles from "./LabControls.module.css";
import { PRESETS } from "./presets";
import type { LrData } from "./Scene";

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
      {custom && <p className={styles.hint}>{t("lab.drawHint")}</p>}

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
