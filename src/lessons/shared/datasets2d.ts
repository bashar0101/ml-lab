import { mulberry32 } from "@/engine/random";

export interface LabeledPoint {
  x: number;
  y: number;
  c: 0 | 1 | 2;
}

export type Dataset2DId = "blobs" | "overlap" | "circles" | "moons" | "xor" | "three-blobs" | "uneven" | "ellipse" | "round" | "stripes";

const clamp = (v: number) => Math.min(9.7, Math.max(0.3, v));
const round = (v: number) => Math.round(v * 100) / 100;

/** Deterministic toy datasets inside the 0–10 box. */
export function makeDataset(id: Dataset2DId, seed = 1, n = 40): LabeledPoint[] {
  const rand = mulberry32(seed * 7919 + id.length * 104729);
  const gauss = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const pt = (x: number, y: number, c: 0 | 1 | 2): LabeledPoint => ({ x: round(clamp(x)), y: round(clamp(y)), c });
  const blob = (cx: number, cy: number, sd: number, c: 0 | 1 | 2, count: number) =>
    Array.from({ length: count }, () => pt(cx + gauss() * sd, cy + gauss() * sd, c));
  const half = Math.floor(n / 2);

  switch (id) {
    case "blobs":
      return [...blob(3.2, 3.5, 0.8, 0, half), ...blob(6.8, 6.5, 0.8, 1, n - half)];
    case "overlap":
      return [...blob(4.2, 4.4, 1.3, 0, half), ...blob(5.8, 5.6, 1.3, 1, n - half)];
    case "circles":
      return Array.from({ length: n }, (_, i) => {
        const inner = i % 2 === 0;
        const a = rand() * 2 * Math.PI;
        const r = inner ? 0.4 + rand() * 1.1 : 3 + rand() * 0.8;
        return pt(5 + r * Math.cos(a), 5 + r * Math.sin(a), inner ? 1 : 0);
      });
    case "moons":
      return Array.from({ length: n }, (_, i) => {
        const upper = i % 2 === 0;
        const t = rand() * Math.PI;
        const x = upper ? Math.cos(t) : 1 - Math.cos(t);
        const y = upper ? Math.sin(t) : 0.5 - Math.sin(t);
        // Moons span x ∈ [−1, 2], y ∈ [−0.5, 1]; map that onto [1.5, 8.5] × [3, 7].
        return pt(1.5 + (x + 1) * 2.33 + gauss() * 0.25, 3 + (y + 0.5) * 2.67 + gauss() * 0.25, upper ? 0 : 1);
      });
    case "xor": {
      const q = Math.floor(n / 4);
      return [
        ...blob(3, 3, 0.7, 0, q),
        ...blob(7, 7, 0.7, 0, q),
        ...blob(3, 7, 0.7, 1, q),
        ...blob(7, 3, 0.7, 1, n - 3 * q),
      ];
    }
    case "uneven": {
      // One big loose group and two small tight ones: k-means likes equal-sized round groups.
      const small = Math.max(2, Math.floor(n / 8));
      return [...blob(3.6, 5, 1.3, 0, n - 2 * small), ...blob(8, 8, 0.35, 1, small), ...blob(8.2, 2.2, 0.35, 1, small)];
    }
    case "ellipse": {
      // A stretched, tilted cloud (about 35°): one direction clearly dominates.
      const a = (35 * Math.PI) / 180;
      return Array.from({ length: n }, () => {
        const u = gauss() * 2.1;
        const v = gauss() * 0.55;
        return pt(5 + u * Math.cos(a) - v * Math.sin(a), 5 + u * Math.sin(a) + v * Math.cos(a), 0);
      });
    }
    case "round":
      return blob(5, 5, 1.6, 0, n);
    case "stripes": {
      // Two long parallel stripes, slightly tilted: the spread is along them, the classes across.
      const a = (12 * Math.PI) / 180;
      return Array.from({ length: n }, (_, i) => {
        const c = (i % 2) as 0 | 1;
        const u = -3.8 + rand() * 7.6;
        const v = (c ? 0.75 : -0.75) + gauss() * 0.18;
        return pt(5 + u * Math.cos(a) - v * Math.sin(a), 5 + u * Math.sin(a) + v * Math.cos(a), c);
      });
    }
    case "three-blobs": {
      const t = Math.floor(n / 3);
      return [...blob(3, 3.2, 0.8, 0, t), ...blob(7, 3.6, 0.8, 1, t), ...blob(5, 7.2, 0.8, 2, n - 2 * t)];
    }
  }
}
