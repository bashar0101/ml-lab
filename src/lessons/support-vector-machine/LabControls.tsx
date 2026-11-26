"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { SVM_LIMITS, type Kernel, type SvmParams } from "./algorithm";
import type { SvmData } from "./Scene";

const KERNELS: Kernel[] = ["linear", "rbf"];

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<SvmParams, SvmData>) {
  const t = useT();
  const p = labels.params;
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["blobs", "overlap", "circles", "moons"]} labels={labels.presets} classes={2} />
      <div className={styles.chips} role="group" aria-label={t("svm.kernel")}>
        {KERNELS.map((k) => (
          <button key={k} type="button" className={styles.chip} aria-pressed={params.kernel === k} onClick={() => onParams({ ...params, kernel: k })}>
            {t(`svm.kernel.${k}`)}
          </button>
        ))}
      </div>
      <Slider
        label={p.C?.label ?? "C"}
        hint={p.C?.hint}
        value={params.C}
        {...SVM_LIMITS.C}
        log
        format={(v) => String(v)}
        onChange={(C) => onParams({ ...params, C })}
      />
      {params.kernel === "rbf" && (
        <Slider
          label={p.gamma?.label ?? "gamma"}
          hint={p.gamma?.hint}
          value={params.gamma}
          {...SVM_LIMITS.gamma}
          log
          format={(v) => String(v)}
          onChange={(gamma) => onParams({ ...params, gamma })}
        />
      )}
      <Slider
        label={p.epochs?.label ?? "epochs"}
        hint={p.epochs?.hint}
        value={params.epochs}
        {...SVM_LIMITS.epochs}
        step={1}
        onChange={(epochs) => onParams({ ...params, epochs })}
      />
    </div>
  );
}
