"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import type { LabControlsProps } from "../types";
import type { PcaParams } from "./algorithm";
import type { PcaData } from "./Scene";

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<PcaParams, PcaData>) {
  const t = useT();
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["ellipse", "round", "stripes", "three-blobs"]} labels={labels.presets} classes={2} />
      <div className={styles.chips} role="group" aria-label={t("pca.components")}>
        {([1, 2] as const).map((c) => (
          <button key={c} type="button" className={styles.chip} aria-pressed={params.components === c} onClick={() => onParams({ components: c })}>
            {t(`pca.components.${c}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
