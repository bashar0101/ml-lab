import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { CNN_DEFAULTS, digitImage, FONT, forwardCnn, runCnn } from "./algorithm";
import fixtures from "./fixtures.json";

const close = (a: unknown, b: unknown): void => {
  if (Array.isArray(a) && Array.isArray(b)) {
    expect(a.length).toBe(b.length);
    a.forEach((v, i) => close(v, b[i]));
  } else expect(a as number).toBeCloseTo(b as number, 9);
};

describe("cnn forward", () => {
  it("uses the same font as the training script", () => {
    for (const [d, rows] of Object.entries(fixtures.font)) expect(FONT[Number(d)]).toEqual(rows);
  });

  it("matches NumPy on the sample images: convolution, pooling and probabilities", () => {
    fixtures.samples.forEach((img, k) => {
      const f = forwardCnn(img);
      close(f.conv, fixtures.conv[k]);
      close(f.pooled, fixtures.pooled[k]);
      close(f.probs, fixtures.probs[k]);
    });
  });

  it("recognises every clean digit", () => {
    for (let d = 0; d < 10; d++) {
      const p = forwardCnn(digitImage(d, 1, 0)).probs;
      expect(p.indexOf(Math.max(...p))).toBe(d);
    }
  });

  it("blank and full canvases give finite probabilities that sum to 1", () => {
    for (const v of [0, 1]) {
      const p = forwardCnn(Array.from({ length: 8 }, () => Array(8).fill(v))).probs;
      expect(p.every(Number.isFinite)).toBe(true);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    }
  });
});

describe("runCnn", () => {
  it("walks the image → 36 window positions → ReLU → pooling → all maps → answer", () => {
    const t = runCnn(digitImage(3, 1, 0), CNN_DEFAULTS);
    const ev = t.frames.map((f) => f.event);
    expect(ev[0]).toBe("init");
    expect(ev.filter((e) => e === "conv")).toHaveLength(36);
    expect(ev.slice(-5)).toEqual(["relu", "pool", "maps", "dense", "done"]);
    for (const tag of ["start", "conv-first", "conv-done", "relu", "pool", "maps", "dense", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
  });

  it("conv frames reveal one more cell each, and record the window's dot product", () => {
    const t = runCnn(digitImage(3, 1, 0), { filter: 2 });
    const conv = t.frames.filter((f) => f.event === "conv");
    conv.forEach((f, k) => expect(f.state.revealed).toBe(k + 1));
    const f = forwardCnn(digitImage(3, 1, 0));
    expect(conv[7].metrics.value).toBeCloseTo(f.conv[2][1][1], 12);
  });

  it("the prediction is the most probable digit", () => {
    const t = runCnn(digitImage(7, 0, 1), CNN_DEFAULTS);
    expect(t.frames.at(-1)!.metrics.prediction).toBe(7);
  });

  it("training report: accuracy drops a lot with 15 % of pixels flipped (break-it claim)", () => {
    expect(fixtures.report.test).toBeGreaterThan(0.9);
    expect(fixtures.report.noise15).toBeLessThan(0.65);
  });
});

describe("break-it claim", () => {
  it("the Noisy 8 preset is still an 8, but only about two-thirds sure, with 0 a real contender", async () => {
    const { noisyEight } = await import("./LabControls");
    const p = forwardCnn(noisyEight()).probs;
    expect(p.indexOf(Math.max(...p))).toBe(8);
    expect(p[8]).toBeLessThan(0.8);
    expect(p[0]).toBeGreaterThan(0.2);
  });
});
