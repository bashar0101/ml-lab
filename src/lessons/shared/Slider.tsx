"use client";

import { useId } from "react";
import { Markdownish } from "@/components/Markdownish";
import styles from "../linear-regression/LabControls.module.css";

/** Labelled range input used by lesson controls. `log` maps the slider onto a log scale. */
export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step = 0.01,
  log = false,
  format = (v) => String(v),
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  log?: boolean;
  format?(v: number): string;
  onChange(v: number): void;
}) {
  const id = useId();
  const toSlider = (v: number) => (log ? Math.log10(v) : v);
  const fromSlider = (v: number) => (log ? Number((10 ** v).toPrecision(2)) : v);
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {/* The box follows the page's direction, so it sits at the line's end (the left in Arabic) and
          clear of the label; only the number inside reads left to right. */}
      <output className={styles.value} aria-hidden="true">
        <span dir="ltr">{format(value)}</span>
      </output>
      <input
        id={id}
        type="range"
        className={styles.range}
        min={toSlider(min)}
        max={toSlider(max)}
        step={log ? 0.05 : step}
        value={toSlider(value)}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
      />
      {hint && (
        <p className={styles.hint}>
          <Markdownish text={hint} inline />
        </p>
      )}
    </div>
  );
}
