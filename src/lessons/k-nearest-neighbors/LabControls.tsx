"use client";

import { useId, useState, type FormEvent } from "react";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { ClassDataControls } from "../shared/ClassDataControls";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { KNN_LIMITS, type KnnParams, type Metric } from "./algorithm";
import type { KnnData } from "./Scene";

const METRICS: Metric[] = ["euclidean", "manhattan"];

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<KnnParams, KnnData>) {
  const t = useT();
  return (
    <div className={styles.controls}>
      <ClassDataControls
        data={data}
        onData={(d) => onData({ ...data, ...d })}
        presets={["blobs", "overlap", "moons", "three-blobs"]}
        labels={labels.presets}
        classes={3}
      />
      <QueryForm key={`${data.query.x},${data.query.y}`} data={data} onData={onData} />
      <Slider
        label={labels.params.k?.label ?? "k"}
        hint={labels.params.k?.hint}
        value={params.k}
        {...KNN_LIMITS.k}
        step={1}
        onChange={(k) => onParams({ ...params, k })}
      />
      <div className={styles.chips} role="group" aria-label={t("knn.metric")}>
        {METRICS.map((m) => (
          <button key={m} type="button" className={styles.chip} aria-pressed={params.metric === m} onClick={() => onParams({ ...params, metric: m })}>
            {t(`knn.metric.${m}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Keyboard way to place the new (question) point; clicking the chart does the same. */
function QueryForm({ data, onData }: { data: KnnData; onData(d: KnnData): void }) {
  const t = useT();
  const xId = useId();
  const yId = useId();
  const [x, setX] = useState(String(data.query.x));
  const [y, setY] = useState(String(data.query.y));
  const nx = Number(x);
  const ny = Number(y);
  const valid = x.trim() !== "" && y.trim() !== "" && Number.isFinite(nx) && Number.isFinite(ny);

  function move(e: FormEvent) {
    e.preventDefault();
    if (valid) onData({ ...data, query: { x: Math.min(10, Math.max(0, nx)), y: Math.min(10, Math.max(0, ny)) } });
  }

  return (
    <form className={styles.addRow} onSubmit={move}>
      <label htmlFor={xId}>
        x
      </label>
      <input id={xId} type="number" step="any" inputMode="decimal" value={x} onChange={(e) => setX(e.target.value)} aria-label={t("knn.queryX")} />
      <label htmlFor={yId}>
        y
      </label>
      <input id={yId} type="number" step="any" inputMode="decimal" value={y} onChange={(e) => setY(e.target.value)} aria-label={t("knn.queryY")} />
      <button type="submit" className={styles.chip} disabled={!valid}>
        {t("knn.moveQuery")}
      </button>
    </form>
  );
}
