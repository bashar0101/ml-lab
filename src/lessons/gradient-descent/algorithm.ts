import type { Frame, Trace } from "@/engine/types";
import { getSurface, type SurfaceId } from "./surfaces";

export type Optimizer = "plain" | "momentum" | "adam";
export const OPTIMIZERS: Optimizer[] = ["plain", "momentum", "adam"];

export interface GdParams {
  surface: SurfaceId;
  optimizer: Optimizer;
  /** Run all three optimizers side by side. */
  compare: boolean;
  learningRate: number;
  steps: number;
  /** Start point; defaults to the surface's own. */
  start?: [number, number] | null;
}

export interface Walker {
  optimizer: Optimizer;
  x: number;
  y: number;
  f: number;
  /** Gradient at (x, y) when it was last measured. */
  gx: number;
  gy: number;
  diverged: boolean;
}

export interface GdState {
  step: number;
  surface: SurfaceId;
  /** The chosen optimizer first; the other two follow when comparing. */
  walkers: Walker[];
}

export const GD_DEFAULTS: GdParams = { surface: "ravine", optimizer: "plain", compare: false, learningRate: 0.18, steps: 40 };
export const GD_LIMITS = { learningRate: { min: 0.01, max: 0.5, step: 0.01 }, steps: { min: 10, max: 120 } } as const;

const BETA = 0.9;
const BETA1 = 0.9;
const BETA2 = 0.999;
const EPS = 1e-8;
const BLOWN = 1e6;

interface Memory {
  vx: number;
  vy: number;
  mx: number;
  my: number;
  sx: number;
  sy: number;
}

export function runGradientDescent(p: GdParams): Trace<GdState> {
  const surface = getSurface(p.surface);
  const [x0, y0] = p.start ?? surface.start;
  const order = p.compare ? [p.optimizer, ...OPTIMIZERS.filter((o) => o !== p.optimizer)] : [p.optimizer];

  let walkers: Walker[] = order.map((optimizer) => {
    const [gx, gy] = surface.grad(x0, y0);
    return { optimizer, x: x0, y: y0, f: surface.f(x0, y0), gx, gy, diverged: false };
  });
  const memory: Memory[] = order.map(() => ({ vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0 }));
  const frames: Frame<GdState>[] = [];
  const meta = { algorithm: "gradient-descent", seed: 0, truncated: false };

  const push = (step: number, codeLine: string, event: string, tags: string[] = [], fOverride?: number) => {
    const w = walkers[0];
    frames.push({
      state: { step, surface: p.surface, walkers: walkers.map((q) => ({ ...q })) },
      codeLine,
      event,
      tags,
      metrics: { step, f: fOverride ?? w.f, grad: Math.hypot(w.gx, w.gy) },
    });
  };

  push(0, "init", "init", ["start"]);

  for (let t = 1; t <= p.steps; t++) {
    // Measure the slope where each walker stands.
    walkers = walkers.map((w) => {
      if (w.diverged) return w;
      const [gx, gy] = surface.grad(w.x, w.y);
      return { ...w, gx, gy };
    });
    push(t - 1, "grad", "grad", t === 1 ? ["first-grad"] : []);

    let primaryBlewUp: number | null = null;
    walkers = walkers.map((w, i) => {
      if (w.diverged) return w;
      const m = memory[i];
      let nx: number;
      let ny: number;
      if (w.optimizer === "plain") {
        nx = w.x - p.learningRate * w.gx;
        ny = w.y - p.learningRate * w.gy;
      } else if (w.optimizer === "momentum") {
        m.vx = BETA * m.vx + w.gx;
        m.vy = BETA * m.vy + w.gy;
        nx = w.x - p.learningRate * m.vx;
        ny = w.y - p.learningRate * m.vy;
      } else {
        m.mx = BETA1 * m.mx + (1 - BETA1) * w.gx;
        m.my = BETA1 * m.my + (1 - BETA1) * w.gy;
        m.sx = BETA2 * m.sx + (1 - BETA2) * w.gx * w.gx;
        m.sy = BETA2 * m.sy + (1 - BETA2) * w.gy * w.gy;
        const c1 = 1 - BETA1 ** t;
        const c2 = 1 - BETA2 ** t;
        nx = w.x - (p.learningRate * (m.mx / c1)) / (Math.sqrt(m.sx / c2) + EPS);
        ny = w.y - (p.learningRate * (m.my / c1)) / (Math.sqrt(m.sy / c2) + EPS);
      }
      const nf = surface.f(nx, ny);
      if (!Number.isFinite(nf) || Math.abs(nf) > BLOWN || !Number.isFinite(nx) || !Number.isFinite(ny)) {
        // Freeze at the last good position so nothing non-finite reaches the picture.
        if (i === 0) primaryBlewUp = Number.isFinite(nf) ? nf : Number.MAX_VALUE;
        return { ...w, diverged: true };
      }
      return { ...w, x: nx, y: ny, f: nf };
    });

    if (primaryBlewUp !== null) {
      push(t, `update-${p.optimizer}`, "diverged", ["diverged", "done"], primaryBlewUp);
      return { frames, meta };
    }
    const tags = t === 1 ? ["first-step"] : t === 10 ? ["step-10"] : [];
    push(t, `update-${p.optimizer}`, "update", tags);
  }

  push(p.steps, "return", "done", ["done"]);
  return { frames, meta };
}
