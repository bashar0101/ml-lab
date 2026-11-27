import { PAPER_LR, PAPER_START, PAPER_TARGET } from "./paper";

export type SurfaceId = "bowl" | "ravine" | "saddle" | "two-valleys" | "paper";

export interface Surface {
  id: SurfaceId;
  f(x: number, y: number): number;
  grad(x: number, y: number): [number, number];
  x: [number, number];
  y: [number, number];
  start: [number, number];
  /** Learning rate that suits this surface; applied when a student switches to it. */
  lr: number;
}

const DOMAIN: [number, number] = [-3, 3];

export const SURFACES: Surface[] = [
  {
    id: "bowl",
    f: (x, y) => x * x + y * y,
    grad: (x, y) => [2 * x, 2 * y],
    x: DOMAIN,
    y: DOMAIN,
    start: [-2.4, 2],
    lr: 0.1,
  },
  {
    id: "ravine",
    f: (x, y) => 0.5 * x * x + 5 * y * y,
    grad: (x, y) => [x, 10 * y],
    x: DOMAIN,
    y: DOMAIN,
    start: [-2.6, 1.2],
    lr: 0.18,
  },
  {
    id: "saddle",
    f: (x, y) => x * x - y * y + 0.25 * y ** 4,
    grad: (x, y) => [2 * x, -2 * y + y ** 3],
    x: DOMAIN,
    y: DOMAIN,
    start: [-2.5, 0.05],
    lr: 0.1,
  },
  {
    id: "two-valleys",
    f: (x, y) => (x * x - 1) ** 2 + 0.4 * x + y * y,
    grad: (x, y) => [4 * x * (x * x - 1) + 0.4, 2 * y],
    x: DOMAIN,
    y: DOMAIN,
    start: [2, 1.5],
    lr: 0.05,
  },
  {
    // The "solve it by hand" loss L(w) = (w − 3)² along x, started on y = 0 so the ball moves
    // only in w; the y² term just gives the picture a second axis.
    id: "paper",
    f: (x, y) => (x - PAPER_TARGET) ** 2 + y * y,
    grad: (x, y) => [2 * (x - PAPER_TARGET), 2 * y],
    x: [-1, 5],
    y: DOMAIN,
    start: [PAPER_START, 0],
    lr: PAPER_LR,
  },
];

export function getSurface(id: SurfaceId): Surface {
  const s = SURFACES.find((q) => q.id === id);
  if (!s) throw new Error(`Unknown surface: ${id}`);
  return s;
}
