"use client";

import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { LOG_LIMITS, type LogParams } from "./algorithm";
import type { LogData } from "./Scene";

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<LogParams, LogData>) {
  const p = labels.params;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["blobs", "overlap", "circles"]} labels={labels.presets} classes={2} />
      <Slider
        label={p.learningRate?.label ?? ""}
        hint={p.learningRate?.hint}
        value={params.learningRate}
        {...LOG_LIMITS.learningRate}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onParams({ ...params, learningRate: v })}
      />
      <Slider
        label={p.steps?.label ?? ""}
        hint={p.steps?.hint}
        value={params.steps}
        {...LOG_LIMITS.steps}
        step={1}
        onChange={(v) => onParams({ ...params, steps: v })}
      />
      <Slider
        label={p.threshold?.label ?? ""}
        hint={p.threshold?.hint}
        value={params.threshold}
        {...LOG_LIMITS.threshold}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onParams({ ...params, threshold: v })}
      />
    </div>
  );
}
