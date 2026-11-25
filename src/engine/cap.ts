import type { Frame } from "./types";

/**
 * Limit a long recording to about `max` frames. Always keeps the first frame, the last
 * frame and every tagged frame (even if those alone exceed `max`); fills the rest of the
 * budget with evenly spaced frames. Order is preserved.
 */
export function capFrames<S>(frames: Frame<S>[], max: number): { frames: Frame<S>[]; truncated: boolean } {
  if (frames.length <= max) return { frames, truncated: false };

  const keep = new Set<number>([0, frames.length - 1]);
  frames.forEach((f, i) => {
    if (f.tags.length > 0) keep.add(i);
  });

  const budget = max - keep.size;
  if (budget > 0) {
    const step = (frames.length - 1) / (budget + 1);
    for (let k = 1; k <= budget; k++) keep.add(Math.round(k * step));
  }

  const indices = [...keep].sort((a, b) => a - b);
  return { frames: indices.map((i) => frames[i]), truncated: true };
}
