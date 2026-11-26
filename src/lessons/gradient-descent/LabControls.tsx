"use client";

import { useId } from "react";
import { Markdownish } from "@/components/Markdownish";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import type { LabControlsProps } from "../types";
import { GD_LIMITS, OPTIMIZERS, type GdParams } from "./algorithm";
import type { GdData } from "./Scene";
import { getSurface, SURFACES } from "./surfaces";

export function LabControls({ params, onParams, onData, labels }: LabControlsProps<GdParams, GdData>) {
  const t = useT();
  const lrId = useId();
  const stepsId = useId();
  const compareId = useId();

  return (
    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label={t("gd.surface")}>
        {SURFACES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={styles.chip}
            aria-pressed={params.surface === s.id}
            onClick={() => {
              onParams({ ...params, surface: s.id, learningRate: getSurface(s.id).lr });
              onData({ start: null });
            }}
          >
            {labels.presets[s.id] ?? s.id}
          </button>
        ))}
      </div>
      <p className={styles.hint}>{t("gd.clickHint")}</p>

      <div className={styles.chips} role="group" aria-label={t("gd.optimizer")}>
        {OPTIMIZERS.map((o) => (
          <button key={o} type="button" className={styles.chip} aria-pressed={params.optimizer === o} onClick={() => onParams({ ...params, optimizer: o })}>
            {t(`gd.optimizer.${o}`)}
          </button>
        ))}
      </div>
      <label htmlFor={compareId} className={styles.check}>
        <input id={compareId} type="checkbox" checked={params.compare} onChange={(e) => onParams({ ...params, compare: e.target.checked })} />
        {t("gd.compare")}
      </label>

      <div className={styles.field}>
        <label htmlFor={lrId} className={styles.label}>
          {labels.params.learningRate?.label}
        </label>
        <output className={styles.value} aria-hidden="true">
          {params.learningRate.toFixed(2)}
        </output>
        <input
          id={lrId}
          type="range"
          className={styles.range}
          min={GD_LIMITS.learningRate.min}
          max={GD_LIMITS.learningRate.max}
          step={GD_LIMITS.learningRate.step}
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
          {labels.params.steps?.label}
        </label>
        <output className={styles.value} aria-hidden="true">
          {params.steps}
        </output>
        <input
          id={stepsId}
          type="range"
          className={styles.range}
          min={GD_LIMITS.steps.min}
          max={GD_LIMITS.steps.max}
          step={1}
          value={params.steps}
          onChange={(e) => onParams({ ...params, steps: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
