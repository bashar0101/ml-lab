"use client";

import { useId, useState, type FormEvent } from "react";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { makeDataset, type Dataset2DId, type LabeledPoint } from "./datasets2d";

export interface ClassData {
  /** A dataset id, or "custom" for points drawn by the student. */
  presetId: string;
  points: LabeledPoint[];
  /** Class given to the next drawn point. */
  drawClass: 0 | 1 | 2;
}

const CLASS_KEYS = ["lab.classA", "lab.classB", "lab.classC"] as const;

/** Presets, draw mode, class picker and a keyboard way to add/remove points, for 2D classifiers. */
export function ClassDataControls({
  data,
  onData,
  presets,
  labels,
  classes,
}: {
  data: ClassData;
  onData(d: ClassData): void;
  presets: Dataset2DId[];
  labels: Record<string, string>;
  /** 1 = unlabelled points (no class picker). */
  classes: 1 | 2 | 3;
}) {
  const t = useT();
  const custom = data.presetId === "custom";
  return (
    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label={t("lab.yourData")}>
        {presets.map((id) => (
          <button
            key={id}
            type="button"
            className={styles.chip}
            aria-pressed={data.presetId === id}
            onClick={() =>
              onData({
                presetId: id,
                points: makeDataset(id),
                drawClass: data.drawClass,
              })
            }
          >
            {labels[id] ?? id}
          </button>
        ))}
        <button
          type="button"
          className={styles.chip}
          aria-pressed={custom}
          onClick={() =>
            onData({ presetId: "custom", points: [], drawClass: 0 })
          }
        >
          {t("lab.drawOwn")}
        </button>
      </div>
      {custom && (
        <>
          {classes > 1 && (
            <div
              className={styles.chips}
              role="group"
              aria-label={t("lab.drawClass")}
            >
              {CLASS_KEYS.slice(0, classes).map((key, c) => (
                <button
                  key={key}
                  type="button"
                  className={styles.chip}
                  aria-pressed={data.drawClass === c}
                  onClick={() => onData({ ...data, drawClass: c as 0 | 1 | 2 })}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          )}
          <p className={styles.hint}>{t("lab.drawHint")}</p>
          <PointForm data={data} onData={onData} classes={classes} />
        </>
      )}
    </div>
  );
}

function PointForm({
  data,
  onData,
  classes,
}: {
  data: ClassData;
  onData(d: ClassData): void;
  classes: 1 | 2 | 3;
}) {
  const t = useT();
  const xId = useId();
  const yId = useId();
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const nx = Number(x);
  const ny = Number(y);
  const valid =
    x.trim() !== "" &&
    y.trim() !== "" &&
    Number.isFinite(nx) &&
    Number.isFinite(ny);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const clamp = (v: number) => Math.min(10, Math.max(0, v));
    onData({
      ...data,
      points: [
        ...data.points,
        { x: clamp(nx), y: clamp(ny), c: data.drawClass },
      ],
    });
    setX("");
    setY("");
  }

  return (
    <div className={styles.points}>
      <form className={styles.addRow} onSubmit={add}>
        <label htmlFor={xId}>{t("lab.pointX")}</label>
        <input
          id={xId}
          type="number"
          step="any"
          inputMode="decimal"
          value={x}
          onChange={(e) => setX(e.target.value)}
        />
        <label htmlFor={yId}>{t("lab.pointY")}</label>
        <input
          id={yId}
          type="number"
          step="any"
          inputMode="decimal"
          value={y}
          onChange={(e) => setY(e.target.value)}
        />
        <button type="submit" className={styles.chip} disabled={!valid}>
          {t("lab.addPoint")}
        </button>
      </form>
      {data.points.length > 0 && (
        <ul className={styles.pointList} aria-label={t("lab.points")}>
          {data.points.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className={styles.pointChip}
                aria-label={t("lab.removePoint", { x: p.x, y: p.y })}
                onClick={() =>
                  onData({
                    ...data,
                    points: data.points.filter((_, k) => k !== i),
                  })
                }
              >
                {classes > 1 ? `${t(CLASS_KEYS[p.c])}: ` : ""}({p.x}, {p.y}){" "}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
