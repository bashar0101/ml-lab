"use client";

import { useId } from "react";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import { Slider } from "../shared/Slider";
import type { LabControlsProps } from "../types";
import { MAX_LENGTH, RNN_LIMITS, type RnnParams } from "./algorithm";
import type { RnnData } from "./Scene";

export const RNN_PRESETS: Record<string, string> = {
  short: "acdhe",
  medium: "bdcfhegdcehf",
  long: "afcdhegchdfegcdhfecgdhfcehdgcf",
};

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<RnnParams, RnnData>) {
  const t = useT();
  const id = useId();
  return (
    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label={t("lab.yourData")}>
        {Object.keys(RNN_PRESETS).map((k) => (
          <button key={k} type="button" className={styles.chip} aria-pressed={data.presetId === k} onClick={() => onData({ presetId: k, text: RNN_PRESETS[k] })}>
            {labels.presets[k] ?? k}
          </button>
        ))}
      </div>
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {t("rnn.textLabel")}
        </label>
        <input
          id={id}
          className={styles.text}
          type="text"
          value={data.text}
          maxLength={MAX_LENGTH}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onData({ presetId: "custom", text: e.target.value.toLowerCase().replace(/\s/g, "") })}
        />
        <p className={styles.hint}>{t("rnn.textHint")}</p>
      </div>
      <Slider
        label={labels.params.memory?.label ?? "memory"}
        hint={labels.params.memory?.hint}
        value={params.memory}
        {...RNN_LIMITS.memory}
        format={(v) => v.toFixed(2)}
        onChange={(memory) => onParams({ memory })}
      />
    </div>
  );
}
