import { describe, expect, it } from "vitest";
import content from "../../../content/en/lessons/convolutional-neural-network.json";
import { interpolate } from "@/engine/text";
import { blankImage, digitImage, forwardCnn, runCnn, CNN_DEFAULTS } from "./algorithm";
import mod from "./index";
import { noisyEight, SHIFTED } from "./LabControls";

describe("cnn review fixes", () => {
  it("drawing and filter changes keep the playback frame (the trace always has the same length)", () => {
    expect(mod.keepFrameOnData).toBe(true);
    expect(mod.viewOnly?.(CNN_DEFAULTS, { ...CNN_DEFAULTS, filter: 2 })).toBe(true);
    const a = runCnn(digitImage(3, 1, 0), CNN_DEFAULTS).frames.length;
    const b = runCnn(blankImage(), { ...CNN_DEFAULTS, filter: 3 }).frames.length;
    expect(a).toBe(b);
  });

  it("the answer text shows a percentage, not a fraction", () => {
    const last = runCnn(digitImage(3, 1, 0), CNN_DEFAULTS).frames.at(-1)!;
    const text = interpolate(content.events.dense.body, last.metrics);
    expect(text).toMatch(/^The network is \d+(\.\d)?% sure it is a 3\.$/);
    expect(text).not.toContain("is 1 sure");
  });

  it("FAQ: a blank canvas still gets a confident answer (it says 1, about 90 %)", () => {
    const { probs } = forwardCnn(blankImage());
    expect(probs.indexOf(Math.max(...probs))).toBe(1);
    expect(Math.max(...probs)).toBeGreaterThan(0.85);
    expect(JSON.stringify(content.article.faq)).toMatch(/blank/i);
  });

  it("FAQ: shifted digits still work: every digit at every position the 8 × 8 grid allows", () => {
    for (let d = 0; d <= 9; d++)
      for (let ox = 0; ox <= 3; ox++)
        for (let oy = 0; oy <= 1; oy++) {
          const p = forwardCnn(digitImage(d, ox, oy)).probs;
          expect(p.indexOf(Math.max(...p)), `${d} at ${ox},${oy}`).toBe(d);
        }
    const p = forwardCnn(SHIFTED).probs;
    expect(p.indexOf(Math.max(...p))).toBe(3);
  });

  it("break it: Noisy 8 has 13 of its 64 squares flipped (about 20 %)", () => {
    const clean = digitImage(8, 1, 0);
    const flipped = noisyEight().flat().filter((v, k) => v !== clean.flat()[k]).length;
    expect(flipped).toBe(13);
    expect(content.lab.breakIt).toContain("13 of its 64 squares");
  });

  it("the conv step mentions the bias that is in the value", () => {
    expect(content.events.conv.body).toMatch(/bias/);
  });
});
