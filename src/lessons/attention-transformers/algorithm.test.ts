import { describe, expect, it } from "vitest";
import {
  ATTN_DEFAULTS,
  FEATURES,
  MAX_WORDS,
  VOCAB,
  attention,
  embed,
  focusWord,
  positionalEncoding,
  runAttention,
  tokenize,
  validateSentence,
} from "./algorithm";

const PRONOUN = "the cat chased the dog and it ran";
const DESCRIBE = "the dog was tired and the cat was hungry";
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

describe("vocabulary and input", () => {
  it("has at most 16 words, each with one value per feature", () => {
    expect(Object.keys(VOCAB).length).toBeLessThanOrEqual(16);
    for (const v of Object.values(VOCAB)) expect(v).toHaveLength(FEATURES.length);
  });

  it("tokenizes on any whitespace and lower-cases", () => {
    expect(tokenize("  The CAT\tran ")).toEqual(["the", "cat", "ran"]);
  });

  it("validates length and vocabulary", () => {
    expect(validateSentence(PRONOUN)).toBeNull();
    expect(validateSentence("cat")).toBe("tooShort");
    expect(validateSentence(Array(MAX_WORDS + 1).fill("cat").join(" "))).toBe("tooLong");
    expect(validateSentence("the cow ran")).toBe("unknownWord");
  });

  it("focuses the first pointing or describing word", () => {
    expect(focusWord(tokenize(PRONOUN))).toBe(6);
    expect(focusWord(tokenize(DESCRIBE))).toBe(3);
    expect(focusWord(["the", "cat", "ran"])).toBe(2);
  });
});

describe("embeddings", () => {
  it("adds a position wave in its own dimensions, or nothing when positions are off", () => {
    const tokens = tokenize(PRONOUN);
    const on = embed(tokens, true);
    const off = embed(tokens, false);
    expect(on[0]).toHaveLength(FEATURES.length + 4);
    expect(on[6].slice(0, FEATURES.length)).toEqual(VOCAB.it);
    expect(on[6].slice(FEATURES.length)).toEqual(positionalEncoding(6));
    expect(off[6].slice(FEATURES.length)).toEqual([0, 0, 0, 0]);
  });
});

describe("attention", () => {
  it("each row of weights is a probability distribution", () => {
    for (const head of [0, 1] as const)
      for (const positions of [true, false]) {
        const { weights } = attention(tokenize(DESCRIBE), head, positions);
        for (const row of weights) {
          expect(sum(row)).toBeCloseTo(1, 12);
          for (const w of row) expect(w).toBeGreaterThan(0);
        }
      }
  });

  it("scores are q·k / √d_k", () => {
    const { q, k, scores } = attention(tokenize(PRONOUN), 0, true);
    const dot = q[6].reduce((s, v, j) => s + v * k[4][j], 0);
    expect(scores[6][4]).toBeCloseTo(dot / Math.sqrt(q[6].length), 12);
  });

  it("story: head 1 sends 'it' mostly to the nearest noun, 'dog' (about 80%)", () => {
    const { weights } = attention(tokenize(PRONOUN), 0, true);
    const row = weights[6];
    expect(row[4]).toBeGreaterThan(0.78);
    expect(row[4]).toBeLessThan(0.82);
    expect(row[1]).toBeGreaterThan(0.11);
    expect(row[1]).toBeLessThan(0.15);
  });

  it("story: the output for 'it' carries mostly dog's meaning", () => {
    const { out } = attention(tokenize(PRONOUN), 0, true);
    const dog = FEATURES.indexOf("dog");
    const cat = FEATURES.indexOf("cat");
    expect(out[6][dog]).toBeGreaterThan(0.78);
    expect(out[6][cat]).toBeLessThan(0.15);
  });

  it("story: 'hungry' finds 'cat', the nearest thing it can describe", () => {
    const { weights } = attention(tokenize(DESCRIBE), 0, true);
    const row = weights[8];
    expect(row.indexOf(Math.max(...row))).toBe(6);
  });

  it("story: head 2 looks at the previous word (about 80%)", () => {
    const { weights } = attention(tokenize(PRONOUN), 1, true);
    for (let i = 1; i < 8; i++) {
      const row = weights[i];
      expect(row.indexOf(Math.max(...row))).toBe(i - 1);
    }
    expect(weights[6][5]).toBeGreaterThan(0.78);
    expect(weights[6][5]).toBeLessThan(0.82);
  });

  it("break it: without positions 'it' splits its attention evenly between cat and dog (about 47% each)", () => {
    const { weights } = attention(tokenize(PRONOUN), 0, false);
    const row = weights[6];
    expect(row[1]).toBeCloseTo(row[4], 12);
    expect(row[1]).toBeGreaterThan(0.46);
    expect(row[1]).toBeLessThan(0.48);
  });

  it("break it: without positions head 2 spreads evenly over every word", () => {
    const { weights } = attention(tokenize(PRONOUN), 1, false);
    for (const row of weights) for (const w of row) expect(w).toBeCloseTo(1 / 8, 12);
  });

  it("break it: without positions shuffling the words changes nothing about who attends to whom", () => {
    const tokens = tokenize(PRONOUN);
    const perm = [7, 2, 5, 0, 6, 1, 4, 3];
    const shuffled = perm.map((p) => tokens[p]);
    for (const head of [0, 1] as const) {
      const a = attention(tokens, head, false).weights;
      const b = attention(shuffled, head, false).weights;
      perm.forEach((pi, i) => perm.forEach((pj, j) => expect(b[i][j]).toBeCloseTo(a[pi][pj], 12)));
    }
  });

  it("with positions on, shuffling the words does change the attention", () => {
    const tokens = tokenize(PRONOUN);
    const shuffled = ["it", "ran", "the", "cat", "chased", "the", "dog", "and"];
    const a = attention(tokens, 0, true).weights[6][4];
    const b = attention(shuffled, 0, true).weights[0][6];
    expect(Math.abs(a - b)).toBeGreaterThan(0.2);
  });

  it("stays finite for the longest sentence and repeated words", () => {
    const tokens = Array(MAX_WORDS).fill("it");
    for (const head of [0, 1] as const) {
      const { weights, out } = attention(tokens, head, true);
      for (const row of [...weights, ...out]) for (const v of row) expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("runAttention", () => {
  it("records init → embed → scores → softmax → mix → all-words → done", () => {
    const tr = runAttention(PRONOUN, ATTN_DEFAULTS);
    expect(tr.frames.map((f) => f.event)).toEqual(["init", "embed", "scores", "softmax", "mix", "all", "done"]);
    expect(tr.frames.map((f) => f.tags[0])).toEqual(["start", "embed", "scores", "softmax", "mix", "all-words", "done"]);
    expect(tr.frames.map((f) => f.codeLine)).toEqual(["init", "embed", "scores", "softmax", "mix", "all", "all"]);
  });

  it("uses the focus word by default and clamps a word index past the end", () => {
    expect(runAttention(PRONOUN, ATTN_DEFAULTS).frames[0].state.word).toBe(6);
    expect(runAttention(PRONOUN, { ...ATTN_DEFAULTS, word: 2 }).frames[0].state.word).toBe(2);
    expect(runAttention(PRONOUN, { ...ATTN_DEFAULTS, word: 40 }).frames[0].state.word).toBe(6);
  });

  it("carries the selected row and both heads' matrices", () => {
    const tr = runAttention(PRONOUN, { word: 6, head: 0, positions: true });
    const last = tr.frames.at(-1)!;
    expect(last.state.weights).toEqual(attention(tokenize(PRONOUN), 0, true).weights[6]);
    expect(last.state.matrices).toHaveLength(2);
    expect(last.state.matrices[1]).toEqual(attention(tokenize(PRONOUN), 1, true).weights);
    expect(last.metrics.top).toBeCloseTo(Math.max(...last.state.weights), 12);
    expect(last.metrics.head).toBe(1);
  });
});

describe("numbers quoted in the lesson text", () => {
  it("scores for 'it': dog 6.60, cat 4.78", () => {
    const { scores } = attention(tokenize(PRONOUN), 0, true);
    expect(scores[6][4].toFixed(2)).toBe("6.60");
    expect(scores[6][1].toFixed(2)).toBe("4.78");
  });

  it("output for 'it': thing 0.92, dog 0.80", () => {
    const { out } = attention(tokenize(PRONOUN), 0, true);
    expect(out[6][FEATURES.indexOf("thing")].toFixed(2)).toBe("0.92");
    expect(out[6][FEATURES.indexOf("dog")].toFixed(2)).toBe("0.80");
  });

  it("long preset without positions: three nouns at 32% each", () => {
    const tokens = tokenize("the bird saw a cat and a dog and it slept");
    const row = attention(tokens, 0, false).weights[9];
    for (const j of [1, 4, 7]) expect(Math.round(row[j] * 100)).toBe(32);
  });

  it("head 2: the first word looks mostly at itself", () => {
    const row = attention(tokenize(PRONOUN), 1, true).weights[0];
    expect(row.indexOf(Math.max(...row))).toBe(0);
    expect(row[0]).toBeGreaterThan(0.75);
  });
});
