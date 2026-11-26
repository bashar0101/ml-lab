"use client";

import { useId } from "react";
import { useT } from "@/i18n/ui-context";
import styles from "../linear-regression/LabControls.module.css";
import type { LabControlsProps } from "../types";
import { focusWord, tokenize, validateSentence, type AttnParams } from "./algorithm";
import type { AttnData } from "./Scene";

export const ATTN_PRESETS: Record<string, string> = {
  pronoun: "the cat chased the dog and it ran",
  describe: "the dog was tired and the cat was hungry",
  long: "the bird saw a cat and a dog and it slept",
};

export function LabControls({ params, data, onParams, onData, labels }: LabControlsProps<AttnParams, AttnData>) {
  const t = useT();
  const textId = useId();
  const posId = useId();
  const tokens = validateSentence(data.text) === null ? tokenize(data.text) : null;
  const word = tokens ? (params.word !== null && params.word < tokens.length ? params.word : focusWord(tokens)) : -1;
  const setData = (d: AttnData) => {
    onParams({ ...params, word: null });
    onData(d);
  };
  return (
    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label={t("lab.yourData")}>
        {Object.keys(ATTN_PRESETS).map((k) => (
          <button key={k} type="button" className={styles.chip} aria-pressed={data.presetId === k} onClick={() => setData({ presetId: k, text: ATTN_PRESETS[k] })}>
            {labels.presets[k] ?? k}
          </button>
        ))}
      </div>
      <div className={styles.field}>
        <label htmlFor={textId} className={styles.label}>
          {t("attn.textLabel")}
        </label>
        <input
          id={textId}
          className={styles.text}
          type="text"
          value={data.text}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setData({ presetId: "custom", text: e.target.value.toLowerCase().replace(/\s+/g, " ") })}
        />
        <p className={styles.hint}>{t("attn.textHint")}</p>
      </div>
      {tokens && (
        <div className={styles.field}>
          <span className={styles.label}>{t("attn.wordLabel")}</span>
          <div className={styles.chips} role="group" aria-label={t("attn.wordLabel")}>
            {tokens.map((w, k) => (
              <button key={k} type="button" className={styles.chip} aria-pressed={k === word} onClick={() => onParams({ ...params, word: k })}>
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={styles.chips} role="group" aria-label={t("attn.headLabel")}>
        {([0, 1] as const).map((h) => (
          <button key={h} type="button" className={styles.chip} aria-pressed={params.head === h} onClick={() => onParams({ ...params, head: h })}>
            {t(h === 0 ? "attn.head1" : "attn.head2")}
          </button>
        ))}
      </div>
      <label htmlFor={posId} className={styles.check}>
        <input id={posId} type="checkbox" checked={params.positions} onChange={(e) => onParams({ ...params, positions: e.target.checked })} />
        {labels.params.positions?.label ?? "positions"}
      </label>
      {labels.params.positions?.hint && <p className={styles.hint}>{labels.params.positions.hint}</p>}
    </div>
  );
}
