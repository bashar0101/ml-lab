"use client";

import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { KMEANS_LIMITS, type KMeansInit, type KMeansParams } from "./algorithm";
import type { KMeansData } from "./Scene";

const INITS: KMeansInit[] = ["random", "plus-plus", "first"];

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<KMeansParams, KMeansData>) {
  const t = useT();
  return (
    <div className={styles.controls}>
      <ClassDataControls data={data} onData={onData} presets={["three-blobs", "blobs", "moons", "circles", "uneven"]} labels={labels.presets} classes={1} />
      <Slider label={labels.params.k?.label ?? "k"} hint={labels.params.k?.hint} value={params.k} {...KMEANS_LIMITS.k} step={1} onChange={(k) => onParams({ ...params, k })} />
      <div className={styles.chips} role="group" aria-label={t("km.init")}>
        {INITS.map((i) => (
          <button key={i} type="button" className={styles.chip} aria-pressed={params.init === i} onClick={() => onParams({ ...params, init: i })}>
            {t(`km.init.${i}`)}
          </button>
        ))}
      </div>
      <button type="button" className={styles.chip} onClick={() => onParams({ ...params, seed: params.seed + 1 })}>
        {t("km.reseed")}
      </button>
    </div>
  );
}
