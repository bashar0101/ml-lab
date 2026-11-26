"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import type { Activation } from "../shared/mlp";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { BP_LIMITS, type BackpropParams } from "./algorithm";
import type { BackpropData } from "./Scene";

const ACTIVATIONS: Activation[] = ["tanh", "relu", "sigmoid"];

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<BackpropParams, BackpropData>) {
  const t = useT();
  const p = labels.params;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["blobs", "moons", "circles"]} labels={labels.presets} classes={2} />
      <Slider label={p.depth?.label ?? "depth"} hint={p.depth?.hint} value={params.depth} {...BP_LIMITS.depth} step={1} onChange={(depth) => onParams({ ...params, depth })} />
      <div className={styles.chips} role="group" aria-label={t("nn.activation")}>
        {ACTIVATIONS.map((a) => (
          <button key={a} type="button" className={styles.chip} aria-pressed={params.activation === a} onClick={() => onParams({ ...params, activation: a })}>
            {t(`nn.activation.${a}`)}
          </button>
        ))}
      </div>
      <Slider
        label={p.learningRate?.label ?? "learningRate"}
        hint={p.learningRate?.hint}
        value={params.learningRate}
        {...BP_LIMITS.learningRate}
        log
        onChange={(learningRate) => onParams({ ...params, learningRate })}
      />
      <button type="button" className={styles.chip} onClick={() => onParams({ ...params, seed: params.seed + 1 })}>
        {t("nn.reseed")}
      </button>
    </div>
  );
}
