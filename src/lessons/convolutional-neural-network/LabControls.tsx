"use client";

import { mulberry32 } from "@/engine/random";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import type { LabControlsProps } from "../types";
import { blankImage, digitImage, type CnnParams } from "./algorithm";
import grid from "./LabControls.module.css";
import type { CnnData } from "./Scene";

/** Digit 8 with 15 % of pixels flipped (a fixed, repeatable pattern). */
export function noisyEight(): CnnData["image"] {
  const rand = mulberry32(15);
  return digitImage(8, 1, 0).map((row) => row.map((v) => (rand() < 0.15 ? 1 - v : v)));
}

export function LabControls({ params, data, onParams, onData }: LabControlsProps<CnnParams, CnnData>) {
  const t = useT();
  const toggle = (r: number, c: number) =>
    onData({ presetId: "custom", image: data.image.map((row, i) => row.map((v, j) => (i === r && j === c ? 1 - v : v))) });
  return (
    <div className={styles.controls}>
      <div className={grid.digits} role="group" aria-label={t("cnn.presets")}>
        {Array.from({ length: 10 }, (_, d) => (
          <button
            key={d}
            type="button"
            className={styles.chip}
            aria-pressed={data.presetId === String(d)}
            aria-label={t("cnn.digit", { d })}
            onClick={() => onData({ presetId: String(d), image: digitImage(d, 1, 0) })}
          >
            {d}
          </button>
        ))}
      </div>
      <div className={styles.chips}>
        <button type="button" className={styles.chip} aria-pressed={data.presetId === "noisy"} onClick={() => onData({ presetId: "noisy", image: noisyEight() })}>
          {t("cnn.noisy")}
        </button>
        <button type="button" className={styles.chip} aria-pressed={data.presetId === "blank"} onClick={() => onData({ presetId: "blank", image: blankImage() })}>
          {t("cnn.blank")}
        </button>
      </div>
      <p className={styles.hint}>{t("cnn.drawHint")}</p>
      <div className={grid.grid} role="group" aria-label={t("cnn.drawGrid")}>
        {data.image.map((row, r) =>
          row.map((v, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              className={grid.cell}
              aria-pressed={v === 1}
              aria-label={t("cnn.pixel", { r: r + 1, c: c + 1 })}
              onClick={() => toggle(r, c)}
            />
          )),
        )}
      </div>
      <div className={styles.chips} role="group" aria-label={t("cnn.filter")}>
        {[0, 1, 2, 3].map((f) => (
          <button key={f} type="button" className={styles.chip} aria-pressed={params.filter === f} onClick={() => onParams({ filter: f })}>
            {t("cnn.scene.filter", { n: f + 1 })}
          </button>
        ))}
      </div>
    </div>
  );
}
