import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";

export interface PcaParams {
  /** Keep 1 component (squash onto PC1) or 2 (keep everything). */
  components: 1 | 2;
}

export interface Analysis {
  mean: [number, number];
  /** Population covariance [cxx, cxy, cyy]. */
  cov: [number, number, number];
  lambda1: number;
  lambda2: number;
  /** Direction of the first component, degrees in [0, 180). */
  pc1Angle: number;
}

export interface PcaState extends Analysis {
  /** Direction currently drawn, degrees (sweep frames and after). */
  angle: number | null;
  /** Variance along each direction tried so far. */
  curve: { angle: number; variance: number }[];
  centred: boolean;
  /** Which components have been found so far. */
  found: 0 | 1 | 2;
  projected: boolean;
  components: 1 | 2;
}

export const PCA_DEFAULTS: PcaParams = { components: 1 };
export const SWEEP_STEP = 6;

export function validatePca(points: LabeledPoint[]): "tooFew" | null {
  return points.length < 2 ? "tooFew" : null;
}

export function varianceAlong(cov: [number, number, number], deg: number): number {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return cov[0] * c * c + 2 * cov[1] * s * c + cov[2] * s * s;
}

export function analyse(points: LabeledPoint[]): Analysis {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let cxx = 0;
  let cxy = 0;
  let cyy = 0;
  for (const p of points) {
    cxx += (p.x - mx) ** 2;
    cxy += (p.x - mx) * (p.y - my);
    cyy += (p.y - my) ** 2;
  }
  cxx /= n;
  cxy /= n;
  cyy /= n;
  // Closed form for a symmetric 2×2 matrix.
  const half = (cxx + cyy) / 2;
  const r = Math.sqrt(((cxx - cyy) / 2) ** 2 + cxy * cxy);
  const theta = (0.5 * Math.atan2(2 * cxy, cxx - cyy) * 180) / Math.PI;
  return { mean: [mx, my], cov: [cxx, cxy, cyy], lambda1: half + r, lambda2: Math.max(0, half - r), pc1Angle: ((theta % 180) + 180) % 180 };
}

export function runPca(points: LabeledPoint[], p: PcaParams): Trace<PcaState> {
  const err = validatePca(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const a = analyse(points);
  const total = a.lambda1 + a.lambda2;
  const explained = total > 0 ? (p.components === 2 ? 1 : a.lambda1 / total) : Number.NaN;
  const frames: Frame<PcaState>[] = [];
  let state: PcaState = { ...a, angle: null, curve: [], centred: false, found: 0, projected: false, components: p.components };

  const push = (codeLine: string, event: string, tags: string[] = []) =>
    frames.push({
      state: { ...state, curve: [...state.curve] },
      codeLine,
      event,
      tags,
      metrics: {
        angle: state.angle ?? Number.NaN,
        variance: state.angle === null ? Number.NaN : varianceAlong(a.cov, state.angle),
        explained: state.found ? explained : Number.NaN,
      },
    });

  push("init", "init", ["start"]);
  state = { ...state, centred: true };
  push("center", "center", ["center"]);
  for (let deg = 0; deg <= 180; deg += SWEEP_STEP) {
    state = { ...state, angle: deg, curve: [...state.curve, { angle: deg, variance: varianceAlong(a.cov, deg) }] };
    push("sweep", "sweep", deg === 0 ? ["sweep"] : []);
  }
  state = { ...state, angle: a.pc1Angle, found: 1 };
  push("pc1", "pc1", ["pc1"]);
  state = { ...state, angle: (a.pc1Angle + 90) % 180, found: 2 };
  push("pc2", "pc2", ["pc2"]);
  state = { ...state, angle: a.pc1Angle, projected: true };
  // Keeping both directions squashes nothing: it is only a rotation onto the new axes.
  if (p.components === 1) push("project", "project", ["project"]);
  else push("keep", "keep", ["project"]);
  push("return", "done", ["done"]);
  return { frames, meta: { algorithm: "pca", seed: 0, truncated: false } };
}
