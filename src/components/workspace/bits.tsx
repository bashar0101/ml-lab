"use client";

import { useT } from "@/i18n/ui-context";
import type { StatChip } from "@/lessons/types";
import type { Mode } from "@/state/hash";
import styles from "./bits.module.css";

export function ModeSwitch({ mode, onMode }: { mode: Mode; onMode(m: Mode): void }) {
  const t = useT();
  return (
    <div className={styles.mode} role="group" aria-label={t("mode.label")}>
      {(["learn", "lab"] as const).map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)}>
          {t(`mode.${m}`)}
        </button>
      ))}
    </div>
  );
}

export function formatStat(v: number): string {
  if (Number.isInteger(v)) return String(v);
  const a = Math.abs(v);
  return a >= 100 ? v.toFixed(1) : v.toFixed(2);
}

export function StatChips({ chips, labels }: { chips: StatChip[]; labels: Record<string, string> }) {
  const t = useT();
  return (
    <div className={styles.stats}>
      {chips.map((c) => (
        <div key={c.labelKey} className={styles.stat}>
          <small>{labels[c.labelKey] ?? c.labelKey}</small>
          <span>
            {c.value === null ? t("stat.tooBig") : formatStat(c.value)}
            {c.suffix && c.value !== null ? <span className={styles.suffix}> {c.suffix}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StepRail({ rails, step, onStep }: { rails: string[]; step: number; onStep(i: number): void }) {
  const t = useT();
  return (
    <ol className={styles.rail} aria-label={t("story.rail")}>
      {rails.map((r, i) => (
        <li key={i}>
          <button
            type="button"
            aria-current={i === step ? "step" : undefined}
            data-done={i < step}
            onClick={() => onStep(i)}
          >
            <b>{i + 1}</b>
            <span>{r}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
