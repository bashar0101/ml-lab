"use client";

import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { TREE_LIMITS, type TreeParams } from "./algorithm";
import type { TreeData } from "./Scene";

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<TreeParams, TreeData>) {
  const p = labels.params;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["blobs", "overlap", "moons", "three-blobs", "xor"]} labels={labels.presets} classes={3} />
      <Slider
        label={p.maxDepth?.label ?? "maxDepth"}
        hint={p.maxDepth?.hint}
        value={params.maxDepth}
        {...TREE_LIMITS.maxDepth}
        step={1}
        onChange={(maxDepth) => onParams({ ...params, maxDepth })}
      />
      <Slider
        label={p.minLeaf?.label ?? "minLeaf"}
        hint={p.minLeaf?.hint}
        value={params.minLeaf}
        {...TREE_LIMITS.minLeaf}
        step={1}
        onChange={(minLeaf) => onParams({ ...params, minLeaf })}
      />
    </div>
  );
}
