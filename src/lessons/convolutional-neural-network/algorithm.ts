import type { Frame, Trace } from "@/engine/types";
import weights from "./weights.json";

export type Image = number[][];

export interface CnnParams {
  /** Which of the four learned filters the slide-by-slide view follows. */
  filter: number;
}

export interface CnnForward {
  /** conv[f][r][c]: 4 filters × 6 × 6 (before ReLU). */
  conv: number[][][];
  relu: number[][][];
  /** pooled[f][i][j]: 4 × 3 × 3. */
  pooled: number[][][];
  probs: number[];
}

export interface CnnState extends CnnForward {
  image: Image;
  filter: number;
  /** Window position on conv frames. */
  pos: { r: number; c: number } | null;
  /** How many cells of the chosen filter's feature map are filled in. */
  revealed: number;
  phase: "init" | "conv" | "relu" | "pool" | "maps" | "dense" | "done";
}

export const CNN_DEFAULTS: CnnParams = { filter: 0 };
export const KERNELS: number[][][] = weights.kernels;

/** The same hand-drawn 5×7 font the training script uses. */
export const FONT: Record<number, string[]> = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

export function blankImage(): Image {
  return Array.from({ length: 8 }, () => Array(8).fill(0));
}

/** Digit d drawn with its 5×7 glyph's top-left corner at (ox, oy). */
export function digitImage(d: number, ox = 1, oy = 0): Image {
  const img = blankImage();
  FONT[d].forEach((row, r) => [...row].forEach((ch, c) => (img[oy + r][ox + c] = ch === "1" ? 1 : 0)));
  return img;
}

export function forwardCnn(image: Image): CnnForward {
  const conv = KERNELS.map((K, f) =>
    Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => {
        let s = 0;
        for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) s += image[r + dr][c + dc] * K[dr][dc];
        return s + weights.kernelBias[f];
      }),
    ),
  );
  const relu = conv.map((m) => m.map((row) => row.map((v) => Math.max(v, 0))));
  const pooled = relu.map((m) =>
    Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => Math.max(m[2 * i][2 * j], m[2 * i][2 * j + 1], m[2 * i + 1][2 * j], m[2 * i + 1][2 * j + 1]))),
  );
  const flat = pooled.flat(2);
  const logits = weights.W.map((row, k) => row.reduce((s, w, i) => s + w * flat[i], weights.b[k]));
  const top = Math.max(...logits);
  const ex = logits.map((v) => Math.exp(v - top));
  const sum = ex.reduce((a, b) => a + b, 0);
  return { conv, relu, pooled, probs: ex.map((v) => v / sum) };
}

export function runCnn(image: Image, p: CnnParams): Trace<CnnState> {
  const f = forwardCnn(image);
  const filter = Math.max(0, Math.min(3, Math.round(p.filter)));
  const prediction = f.probs.indexOf(Math.max(...f.probs));
  const frames: Frame<CnnState>[] = [];
  const push = (phase: CnnState["phase"], codeLine: string, pos: CnnState["pos"], revealed: number, tags: string[] = [], value = Number.NaN) =>
    frames.push({
      state: { ...f, image, filter, pos, revealed, phase },
      codeLine,
      event: phase === "init" ? "init" : phase,
      tags,
      metrics: { prediction, confidence: f.probs[prediction], confidencePct: Math.round(f.probs[prediction] * 1000) / 10, value, filter: filter + 1 },
    });

  push("init", "init", null, 0, ["start"]);
  for (let k = 0; k < 36; k++) {
    const r = Math.floor(k / 6);
    const c = k % 6;
    push("conv", "conv", { r, c }, k + 1, k === 0 ? ["conv-first"] : k === 35 ? ["conv-done"] : [], f.conv[filter][r][c]);
  }
  push("relu", "relu", null, 36, ["relu"]);
  push("pool", "pool", null, 36, ["pool"]);
  push("maps", "maps", null, 36, ["maps"]);
  push("dense", "dense", null, 36, ["dense"]);
  push("done", "return", null, 36, ["done"]);
  return { frames, meta: { algorithm: "convolutional-neural-network", seed: 0, truncated: false } };
}
