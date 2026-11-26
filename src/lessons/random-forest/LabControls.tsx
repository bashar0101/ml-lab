"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { FOREST_LIMITS, type ForestParams } from "./algorithm";
import type { ForestData } from "./Scene";

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<ForestParams, ForestData>) {
  const t = useT();
  const p = labels.params;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["overlap", "moons", "xor", "circles"]} labels={labels.presets} classes={2} />
      <Slider label={p.trees?.label ?? "trees"} hint={p.trees?.hint} value={params.trees} {...FOREST_LIMITS.trees} step={1} onChange={(trees) => onParams({ ...params, trees })} />
      <Slider
        label={p.maxDepth?.label ?? "maxDepth"}
        hint={p.maxDepth?.hint}
        value={params.maxDepth}
        {...FOREST_LIMITS.maxDepth}
        step={1}
        onChange={(maxDepth) => onParams({ ...params, maxDepth })}
      />
      <button type="button" className={styles.chip} onClick={() => onParams({ ...params, seed: params.seed + 1 })}>
        {t("rf.reseed")}
      </button>
    </div>
  );
}
