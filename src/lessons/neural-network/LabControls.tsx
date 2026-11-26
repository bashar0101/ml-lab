"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import type { Activation } from "../shared/mlp";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { NN_LIMITS, type NetParams } from "./algorithm";
import type { NetData } from "./Scene";

const ACTIVATIONS: Activation[] = ["tanh", "relu", "sigmoid"];

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<NetParams, NetData>) {
  const t = useT();
  const p = labels.params;
  const layers = params.hidden.length;
  const neurons = params.hidden[0] ?? 1;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["circles", "moons", "xor", "blobs", "overlap"]} labels={labels.presets} classes={2} />
      <Slider
        label={p.layers?.label ?? "layers"}
        hint={p.layers?.hint}
        value={layers}
        {...NN_LIMITS.layers}
        step={1}
        onChange={(n) => onParams({ ...params, hidden: Array.from({ length: n }, () => neurons) })}
      />
      <Slider
        label={p.neurons?.label ?? "neurons"}
        hint={p.neurons?.hint}
        value={neurons}
        {...NN_LIMITS.neurons}
        step={1}
        onChange={(n) => onParams({ ...params, hidden: Array.from({ length: layers }, () => n) })}
      />
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
        {...NN_LIMITS.learningRate}
        log
        onChange={(learningRate) => onParams({ ...params, learningRate })}
      />
      <Slider label={p.epochs?.label ?? "epochs"} hint={p.epochs?.hint} value={params.epochs} {...NN_LIMITS.epochs} step={10} onChange={(epochs) => onParams({ ...params, epochs })} />
      <button type="button" className={styles.chip} onClick={() => onParams({ ...params, seed: params.seed + 1 })}>
        {t("nn.reseed")}
      </button>
    </div>
  );
}
