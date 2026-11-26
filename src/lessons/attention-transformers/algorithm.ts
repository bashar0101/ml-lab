import type { Frame, Trace } from "@/engine/types";

/**
 * A tiny, hand-set self-attention layer with two heads. Nothing here is trained:
 * the weights are chosen so each head does one readable job, and the lesson says so.
 *
 * Every word is a vector of 13 numbers: 9 "meaning" features, then 4 slots that
 * hold a position wave. Positions are *added* (the meaning vector is zero there).
 */
export const FEATURES = ["thing", "action", "pointer", "glue", "describe", "cat", "dog", "bird", "fish"] as const;
const F = FEATURES.length;
const P = 4;

const vec = (...on: (typeof FEATURES)[number][]) => FEATURES.map((f) => (on.includes(f) ? 1 : 0));

export const VOCAB: Record<string, number[]> = {
  the: vec("glue"),
  a: vec("glue"),
  and: vec("glue"),
  cat: vec("thing", "cat"),
  dog: vec("thing", "dog"),
  bird: vec("thing", "bird"),
  fish: vec("thing", "fish"),
  it: vec("pointer"),
  chased: vec("action"),
  saw: vec("action"),
  ate: vec("action"),
  ran: vec("action"),
  slept: vec("action"),
  was: vec("action"),
  hungry: vec("describe"),
  tired: vec("describe"),
};

export const MIN_WORDS = 2;
export const MAX_WORDS = 12;

export interface AttnParams {
  /** Index of the word being inspected; null = the sentence's focus word. */
  word: number | null;
  head: 0 | 1;
  positions: boolean;
}

export const ATTN_DEFAULTS: AttnParams = { word: null, head: 0, positions: true };

export const tokenize = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

export function validateSentence(text: string): "tooShort" | "tooLong" | "unknownWord" | null {
  const tokens = tokenize(text);
  if (tokens.length < MIN_WORDS) return "tooShort";
  if (tokens.length > MAX_WORDS) return "tooLong";
  if (tokens.some((w) => !(w in VOCAB))) return "unknownWord";
  return null;
}

/** The first word that points at or describes something; otherwise the last word. */
export function focusWord(tokens: string[]): number {
  const k = tokens.findIndex((w) => VOCAB[w][FEATURES.indexOf("pointer")] || VOCAB[w][FEATURES.indexOf("describe")]);
  return k >= 0 ? k : tokens.length - 1;
}

/** Two waves: a fast one (period 6 words) and a slow one (period 24 words). */
const FAST = Math.PI / 3;
const SLOW = Math.PI / 12;
export const positionalEncoding = (i: number) => [Math.sin(FAST * i), Math.cos(FAST * i), Math.sin(SLOW * i), Math.cos(SLOW * i)];

export function embed(tokens: string[], positions: boolean): number[][] {
  return tokens.map((w, i) => [...VOCAB[w], ...(positions ? positionalEncoding(i) : [0, 0, 0, 0])]);
}

/** Desired score strengths (after dividing by √d_k). */
const ALPHA = 4; // head 1: "pointing/describing word looks for a thing"
const BETA = 3; // head 1: "prefer nearby words" (slow wave only)
const GAMMA = 4; // head 2: "look at the previous word" (both waves)

const zeros = (r: number, c: number) => Array.from({ length: r }, () => new Array<number>(c).fill(0));

/** Builds W_q, W_k (d_k × 13) for each head so that q·k/√d_k equals the strengths above. */
function headWeights(head: 0 | 1): { wq: number[][]; wk: number[][] } {
  const col = (f: (typeof FEATURES)[number]) => FEATURES.indexOf(f);
  if (head === 0) {
    const dk = 3;
    const c1 = Math.sqrt(ALPHA * Math.sqrt(dk));
    const c2 = Math.sqrt(BETA * Math.sqrt(dk));
    const wq = zeros(dk, F + P);
    const wk = zeros(dk, F + P);
    wq[0][col("pointer")] = c1;
    wq[0][col("describe")] = c1;
    wk[0][col("thing")] = c1;
    wq[1][F + 2] = wk[1][F + 2] = c2;
    wq[2][F + 3] = wk[2][F + 3] = c2;
    return { wq, wk };
  }
  const dk = 4;
  const c = Math.sqrt(GAMMA * Math.sqrt(dk));
  const wq = zeros(dk, F + P);
  const wk = zeros(dk, F + P);
  // The query is the position wave turned back by one step, so it matches the previous word's key.
  [FAST, SLOW].forEach((w, pair) => {
    const s = F + 2 * pair;
    const r = 2 * pair;
    wq[r][s] = c * Math.cos(w);
    wq[r][s + 1] = -c * Math.sin(w);
    wq[r + 1][s] = c * Math.sin(w);
    wq[r + 1][s + 1] = c * Math.cos(w);
    wk[r][s] = c;
    wk[r + 1][s + 1] = c;
  });
  return { wq, wk };
}

const WEIGHTS = [headWeights(0), headWeights(1)] as const;
const matVec = (m: number[][], x: number[]) => m.map((row) => row.reduce((s, v, j) => s + v * x[j], 0));
const dot = (a: number[], b: number[]) => a.reduce((s, v, j) => s + v * b[j], 0);

function softmax(row: number[]): number[] {
  const m = Math.max(...row);
  const e = row.map((v) => Math.exp(v - m));
  const z = e.reduce((s, v) => s + v, 0);
  return e.map((v) => v / z);
}

export interface Attention {
  x: number[][];
  q: number[][];
  k: number[][];
  /** Values are the meaning part of each word. */
  v: number[][];
  scores: number[][];
  weights: number[][];
  out: number[][];
}

export function attention(tokens: string[], head: 0 | 1, positions: boolean): Attention {
  const x = embed(tokens, positions);
  const { wq, wk } = WEIGHTS[head];
  const q = x.map((xi) => matVec(wq, xi));
  const k = x.map((xi) => matVec(wk, xi));
  const v = x.map((xi) => xi.slice(0, F));
  const scale = Math.sqrt(wq.length);
  const scores = q.map((qi) => k.map((kj) => dot(qi, kj) / scale));
  const weights = scores.map(softmax);
  const out = weights.map((row) => FEATURES.map((_, f) => row.reduce((s, w, j) => s + w * v[j][f], 0)));
  return { x, q, k, v, scores, weights, out };
}

export type AttnStage = "init" | "embed" | "scores" | "softmax" | "mix" | "all" | "done";

export interface AttnState {
  tokens: string[];
  word: number;
  head: 0 | 1;
  positions: boolean;
  stage: AttnStage;
  /** The inspected word's embedding, query; every word's key. */
  x: number[];
  q: number[];
  k: number[][];
  scores: number[];
  weights: number[];
  out: number[];
  /** Attention weights for every word, head 1 and head 2. */
  matrices: [number[][], number[][]];
}

export function runAttention(text: string, p: AttnParams): Trace<AttnState> {
  const tokens = tokenize(text);
  const word = p.word !== null && p.word < tokens.length ? p.word : focusWord(tokens);
  const heads = [attention(tokens, 0, p.positions), attention(tokens, 1, p.positions)] as const;
  const a = heads[p.head];
  const base = {
    tokens,
    word,
    head: p.head,
    positions: p.positions,
    x: a.x[word],
    q: a.q[word],
    k: a.k,
    scores: a.scores[word],
    weights: a.weights[word],
    out: a.out[word],
    matrices: [heads[0].weights, heads[1].weights] as [number[][], number[][]],
  };
  const top = Math.max(...a.weights[word]);
  const steps: [AttnStage, string, string][] = [
    ["init", "init", "start"],
    ["embed", "embed", "embed"],
    ["scores", "scores", "scores"],
    ["softmax", "softmax", "softmax"],
    ["mix", "mix", "mix"],
    ["all", "all", "all-words"],
    ["done", "all", "done"],
  ];
  const frames: Frame<AttnState>[] = steps.map(([stage, codeLine, tag]) => ({
    state: { ...base, stage },
    codeLine,
    event: stage,
    metrics: { n: tokens.length, word, head: p.head + 1, top, positions: p.positions ? 1 : 0 },
    tags: [tag],
  }));
  return { frames, meta: { algorithm: "attention-transformers", seed: 0, truncated: false } };
}
