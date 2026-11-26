import { mulberry32 } from "@/engine/random";
import type { Frame, Trace } from "@/engine/types";
import weights from "./weights.json";

export const LETTERS = "abcdefgh";
export const CHART_LENGTHS = [2, 4, 8, 15, 25, 40];
export const MAX_LENGTH = 40;

export interface RnnParams {
  /** Scales the recurrent weights Wh: 1 = the trained network, smaller = weaker memory. */
  memory: number;
}

export interface RnnState {
  text: string;
  /** Letters read so far. */
  step: number;
  /** hidden[t]: the 6 hidden values after reading t letters (hidden[0] = zeros). */
  hidden: number[][];
  prob: number;
  answered: boolean;
  memory: number;
  chart: { length: number; accuracy: number }[];
}

export const RNN_DEFAULTS: RnnParams = { memory: 1 };
export const RNN_LIMITS = { memory: { min: 0.1, max: 1, step: 0.05 } } as const;

export function validateText(text: string): "tooShort" | "tooLong" | "badLetters" | "badStart" | null {
  if (text.length < 2) return "tooShort";
  if (text.length > MAX_LENGTH) return "tooLong";
  if (![...text].every((ch) => LETTERS.includes(ch))) return "badLetters";
  if (text[0] !== "a" && text[0] !== "b") return "badStart";
  return null;
}

export function forwardRnn(text: string, memory: number): { hidden: number[][]; prob: number } {
  const H = weights.b.length;
  let h = Array.from({ length: H }, () => 0);
  const hidden = [h];
  for (const ch of text) {
    const x = LETTERS.indexOf(ch);
    h = weights.Wh.map((row, j) => Math.tanh(weights.Wx[j][x] + memory * row.reduce((s, w, k) => s + w * h[k], 0) + weights.b[j]));
    hidden.push(h);
  }
  const z = weights.v.reduce((s, w, k) => s + w * h[k], weights.c);
  return { hidden, prob: 1 / (1 + Math.exp(-z)) };
}

/** Share of random strings of this length whose first letter (a or b) is remembered correctly. */
export function accuracyAtLength(length: number, memory: number, samples = 200, seed = 99): number {
  const rand = mulberry32(seed + length);
  let right = 0;
  for (let i = 0; i < samples; i++) {
    const first = rand() < 0.5 ? "a" : "b";
    let text = first;
    for (let k = 1; k < length; k++) text += LETTERS[2 + Math.floor(rand() * 6)];
    if ((forwardRnn(text, memory).prob >= 0.5) === (first === "a")) right++;
  }
  return right / samples;
}

export function runRnn(text: string, p: RnnParams): Trace<RnnState> {
  const err = validateText(text);
  if (err) throw new Error(`Invalid text: ${err}`);
  const f = forwardRnn(text, p.memory);
  const chart = CHART_LENGTHS.map((length) => ({ length, accuracy: accuracyAtLength(length, p.memory) }));
  const frames: Frame<RnnState>[] = [];
  const push = (step: number, codeLine: string, event: string, tags: string[], answered = false) =>
    frames.push({
      state: { text, step, hidden: f.hidden, prob: f.prob, answered, memory: p.memory, chart },
      codeLine,
      event,
      tags,
      metrics: { step, length: text.length, prob: f.prob, probPct: Math.round(f.prob * 1000) / 10, memory: p.memory },
    });
  push(0, "init", "init", ["start"]);
  for (let t = 1; t <= text.length; t++) push(t, "read", "read", t === 1 ? ["first-step"] : t === 3 ? ["step-3"] : []);
  push(text.length, "predict", "predict", ["done"], true);
  return { frames, meta: { algorithm: "recurrent-neural-network", seed: 0, truncated: false } };
}
