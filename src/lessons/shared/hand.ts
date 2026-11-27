/**
 * "Solve it by hand": a small worked example per lesson, solved step by step the way a student
 * would on paper. The numbers are computed here, so every table and formula is right by
 * construction; the words (problem, step titles, explanations) live in the lesson content.
 *
 * Text in tables and math lines may contain {label} placeholders, filled from the lesson
 * content's byHand.labels (words such as "good" or "sunny"). Prose may contain {var}
 * placeholders, filled from the example's vars and the step's own vars.
 */
export interface HandTable {
  /** A short name shown above the table, e.g. "{image}". */
  caption?: string;
  headers: string[];
  rows: string[][];
  /** A totals row (e.g. Σ). */
  foot?: string[];
  /** Rows to highlight (0-based), e.g. the chosen neighbours. */
  mark?: number[];
}

export type HandBlock = { math: string[] } | { table: HandTable };

export interface HandStep {
  id: string;
  blocks: HandBlock[];
  vars?: Record<string, string>;
}

export interface HandExample {
  /** The data the problem gives. */
  given: HandBlock[];
  /** Values the problem statement and the answer refer to. */
  vars: Record<string, string>;
  steps: HandStep[];
}

export const MINUS = "−";

/** A number as it is written by hand: rounded to `dp` places, no trailing zeros, a real minus sign. */
export function fmt(v: number, dp = 2): string {
  const p = 10 ** dp;
  const r = Math.round(v * p) / p;
  return String(Object.is(r, -0) ? 0 : r).replace("-", MINUS);
}

/** Like fmt, but negative numbers get brackets so they can sit inside an expression: 4 · (−3). */
export function term(v: number, dp = 2): string {
  const s = fmt(v, dp);
  return s.startsWith(MINUS) ? `(${s})` : s;
}

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: readonly number[]) => sum(xs) / xs.length;
