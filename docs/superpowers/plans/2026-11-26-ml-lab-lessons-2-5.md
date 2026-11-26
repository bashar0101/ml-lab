# ML Lab: Lessons 2–5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship lessons 2–5 (Gradient Descent, Logistic Regression, k-Nearest Neighbors, Support Vector Machine) on the existing workspace, each on its own branch, merged to `main` and pushed when green.

**Architecture:** Each lesson is a `LessonModule` (see `src/lessons/types.ts`) whose `run()` records a `Trace`; nothing in the workspace changes. Shared 2D plotting pieces (axes, clipped lines, class markers, region maps, contour lines, seeded 2D datasets) move into `src/lessons/shared/` and are reused by every 2D lesson. The gradient-descent "compare optimizers" mode lives inside that lesson's own trace (each frame holds every active optimizer's position), so the workspace stays generic.

**Tech Stack:** as Plan 1 (Next.js 16.4 static export, React 19, TypeScript, CSS Modules, zod, Vitest, Playwright, NumPy for fixtures).

**Spec:** `docs/superpowers/specs/2026-11-26-ml-lab-design.md` (§6 rows 2–5). Plan 1: `docs/superpowers/plans/2026-11-26-ml-lab-foundation-and-lesson-1.md`.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies (static export, all text in `content/en`, logical CSS properties, palette, fonts, Python + pseudocode only, reduced motion, keyboard reachable, ≤ 200 KB JS on each lesson page).
- **Git:** one branch per lesson (`lesson/<slug>`), plus `refactor/shared-2d` for the shared helpers. When a branch is green (unit + e2e + build + budget + lint): merge into `main` with `--no-ff`, push `main`, delete the branch locally. Commit messages carry **no** Claude/co-author trailers; author is the user's git identity.
- Every lesson: Learn story of 6–8 steps whose frame tags exist in the default trace; events for every frame event; a "break it" control; `lab.errors` for every validation key; article ≥ 4 sections incl. a table; FAQ ≥ 4.
- Every algorithm with numeric training is checked against a NumPy fixture in `tools/fixtures/<slug>.py` (randomness via a mulberry32 port so TS and Python see the same order).
- 2D classification points: class 0 = peach circle, class 1 = lavender square (shape differs, not only colour); optional class 2 = green triangle.
- Datasets live in a 0–10 × 0–10 box.

## Review Focus

1. **Diverging optimizers** (GD lr too high, Adam on saddle): no NaN reaches the SVG; diverged frame stops the run. Pinned in Tasks 2 and 3.
2. **Single-class or tiny drawn data** for classifiers (all points one class, < 2 points per class): validation message, previous run kept. Pinned in Tasks 4, 6, 8.
3. **Ties in KNN votes and k > number of points:** deterministic tie-break (nearest neighbour's class), k clamped. Pinned in Task 6.
4. **Probability extremes in logistic regression** (log(0)): loss uses a clipped probability (1e-12). Pinned in Task 4.
5. **Region maps on phones:** grid stays ≤ 32×32 cells so the SVG stays light. Pinned in Task 1.

---

### Task 1 (branch `refactor/shared-2d`): Shared 2D helpers

**Files:** Create `src/lessons/shared/axes.ts` (move `niceDomain`, `niceStep`, `clipLine` out of the linear-regression Scene), `src/lessons/shared/datasets2d.ts`, `src/lessons/shared/regions.ts`, `src/lessons/shared/contours.ts`, `src/lessons/shared/Plot2D.tsx` (+ `.module.css`), tests for each. Modify `src/lessons/linear-regression/Scene.tsx` to import from `shared/axes`.

**Interfaces (produced):**

```ts
type Range = [number, number];
function niceDomain(values: number[], count?: number): { domain: Range; ticks: number[] }
function clipLine(line: { slope: number; intercept: number }, x: Range, y: Range): [[number, number], [number, number]] | null
interface LabeledPoint { x: number; y: number; c: 0 | 1 | 2 }
type Dataset2DId = "blobs" | "overlap" | "circles" | "moons" | "xor" | "three-blobs";
function makeDataset(id: Dataset2DId, seed?: number, n?: number): LabeledPoint[]   // deterministic, inside 0–10
function regionGrid(predict: (x: number, y: number) => number, x: Range, y: Range, n: number): { cells: { x: number; y: number; v: number }[]; size: [number, number] } // n ≤ 32
function contourSegments(f: (x: number, y: number) => number, x: Range, y: Range, n: number, level: number): [number, number][][]  // marching squares, each segment = 2 points
// Plot2D: viewBox box with axes; children receive scale fns via render prop
function Plot2D(props: { box: { x0: number; y0: number; x1: number; y1: number }; x: Range; y: Range; xLabel?: string; yLabel?: string; ticks?: boolean; children(s: Scale2D): ReactNode; onPlotClick?(p: { x: number; y: number }): void }): JSX.Element
interface Scale2D { sx(x: number): number; sy(y: number): number; invert(px: number, py: number): { x: number; y: number } }
function ClassMarker(props: { x: number; y: number; c: 0 | 1 | 2; r?: number; dim?: boolean; ring?: boolean; onClick?(): void }): JSX.Element  // data-part="point" data-class
```

- [ ] Tests first: `axes.test.ts` (niceDomain [1,9]→[0,10] ticks 0..10 step 2; clipLine keeps slope; null when outside), `datasets2d.test.ts` (same seed → same points; all inside 0–10; both classes present; `circles` not linearly separable: best single-threshold accuracy on any axis < 0.75), `regions.test.ts` (n clamped to 32; cell count n²), `contours.test.ts` (circle f=x²+y² level 1 → all segment endpoints at radius ≈1 ±0.08), `Plot2D.test.tsx` (click maps through `getScreenCTM` → invert; jsdom stub).
- [ ] Run → FAIL. Implement. Run full suite + e2e (`npm run build && npx playwright test`) → PASS (LR unchanged).
- [ ] Commit `refactor: shared 2D plotting helpers`; merge `--no-ff` into `main`; push.

### Task 2 (branch `lesson/gradient-descent`): Gradient descent algorithm

**Files:** `tools/fixtures/gradient_descent.py`, `src/lessons/gradient-descent/{surfaces.ts,algorithm.ts,fixtures.json,algorithm.test.ts}`.

**Interfaces:**

```ts
type SurfaceId = "bowl" | "ravine" | "saddle" | "two-valleys";
interface Surface { id: SurfaceId; f(x: number, y: number): number; grad(x: number, y: number): [number, number]; x: Range; y: Range; start: [number, number] }
// bowl: x²+y²; ravine: 0.5x²+5y²; saddle: x²−y²+0.25y⁴; two-valleys: (x²−1)²+0.4x+y²   (domains [-3,3]²)
// starts: bowl (-2.4,2), ravine (-2.6,1.2), saddle (-2.5,0.05), two-valleys (2,1.5)
type Optimizer = "plain" | "momentum" | "adam";
interface GdParams { surface: SurfaceId; optimizer: Optimizer; compare: boolean; learningRate: number; steps: number; start?: [number, number] }
interface Walker { optimizer: Optimizer; x: number; y: number; f: number; gx: number; gy: number; diverged: boolean }
interface GdState { step: number; walkers: Walker[] }   // walkers = [optimizer] or all three when compare
const GD_DEFAULTS: GdParams = { surface: "ravine", optimizer: "plain", compare: false, learningRate: 0.18, steps: 40 };
function runGradientDescent(p: GdParams): Trace<GdState>
```

Frames: `init` (tags start) → per step `grad` (codeLine `grad`, tag `first-grad` on step 1) then `update` (codeLine `update-<optimizer>` of the primary walker; tags `first-step` step 1, `step-10` step 10) → `done` (`return`). Momentum β=0.9 (`v = 0.9v + g; x -= lr·v`); Adam β1=0.9, β2=0.999, ε=1e-8, bias-corrected. A walker whose |f| > 1e6 or non-finite is frozen with `diverged: true`; if the primary diverges, emit `diverged` (tags diverged, done) and stop. Metrics: step, f (primary), |g| (primary).

- [ ] NumPy fixture: positions after steps 1, 10, 40 for each optimizer on each surface with defaults. Tests: matches to 1e-9; frame count `1 + 2·steps + 1`; ravine plain lr 0.21 diverges (y factor |1−10·lr| > 1); two-valleys plain from (2,1.5) ends near the right-hand local minimum (x > 0) while momentum lr 0.05 reaches x < 0 (global); compare=true carries three walkers; no NaN metrics.
- [ ] Implement; PASS; commit.

### Task 3 (same branch): Gradient descent scene, controls, content

**Files:** `src/lessons/gradient-descent/{Scene.tsx,Scene.module.css,LabControls.tsx,code.ts,index.ts,Scene.test.tsx}`, `content/en/lessons/gradient-descent.json`, registry entry, manifest status `live`.

Scene (viewBox 780×395): left = top-down contour map of the surface (12 levels, `contourSegments`, filled band colours by level) with walker paths (plain: ink solid; momentum: blue dashed; adam: orange dotted, plus legend when compare) and a gradient arrow on `grad` frames; right = "height over steps" line chart (one line per walker). Reveal keys: `surface`, `ball`, `arrow`, `path`, `chart`.
LabControls: surface chips (4), optimizer chips (3), "Compare all three" toggle, learning-rate slider 0.01–0.5, steps 10–120; click on the map sets the start point (`onData`/params). Data type: `{ start: [number, number] | null }`; params carry surface/optimizer.
Code (Python, keys): `grad`, `update-plain`, `update-momentum`, `update-adam`, `init`, `return` (one function with three branches; see Interfaces). Pseudocode mirrors it.
Story (6): `fog` (start; surface, ball) "Lost in the fog" → `feel` (first-grad; + arrow) "Feel the slope" → `step` (first-step; + path) "One step downhill" → `zigzag` (step-10; + chart) "Why it zig-zags" → `size` (step-10) "Step size is everything" → `arrive` (done) "It got there — slowly".
Break it: lr above 0.2 on the ravine; two-valleys gets stuck in the shallow valley; then turn on Compare.

- [ ] Tests first: scene renders no NaN on a diverged frame; legend only in compare; reveal hides arrow/path; codeLine keys exist in both tabs for all three optimizers; contract tests (existing, auto for live lessons) pass; manifest test updated to the live list.
- [ ] Generic e2e `e2e/lessons.spec.ts`: for every live lesson — Learn walks to the last step with no console errors, Lab plays ≥ 2 frames. Delete the LR-only duplicate cases it covers.
- [ ] Build, budget, e2e, lint → PASS; commit; merge `--no-ff` to `main`; push.

### Tasks 4–5 (branch `lesson/logistic-regression`)

**Algorithm:** features standardised; `p = σ(w1·x1 + w2·x2 + b)`; loss = mean log-loss with p clipped to [1e-12, 1−1e-12]; full-batch GD. `LogParams { learningRate: 0.5, steps: 60, threshold: 0.5 }`, init w=(0,0), b=0. Frames per step: `predict`, `error`, `update`; tags `start`, `first-update`, `update-10`, `done`; `diverged` like LR. Metrics: step, loss, accuracy (at threshold). Validation: `tooFew` (< 4 points), `oneClass`.
**Scene:** left = 2D plot with probability shading (`regionGrid` 28×28, v = p) and the boundary where p = threshold (straight line from w, clipped); points via `ClassMarker`, misclassified ones ringed in red. Right = sigmoid curve with each point placed at (z_i, p_i) and coloured by class. Reveal: `points`, `boundary`, `shade`, `sigmoid`.
**Controls:** presets `blobs`, `overlap`, `circles`; draw mode with class toggle (A/B) and keyboard add form; lr 0.05–5, steps 10–200, threshold 0.05–0.95 (re-draws boundary + accuracy without retraining).
**Story (6):** `problem` (pass/fail from two exam scores) → `line-to-prob` (a line gives any number; squash it) → `sigmoid` → `surprise` (log-loss punishes confident mistakes) → `learn` (update-10) → `boundary` (done).
**Break it:** `circles` — no straight line separates them (accuracy ≈ 50 %); huge lr → overshoot.
- [ ] NumPy fixture (w, b after steps 1, 10, 60 for each preset) → tests → implement → scene/content tests → e2e → merge → push.

### Tasks 6–7 (branch `lesson/k-nearest-neighbors`)

**Algorithm:** no training. Data `{ presetId, points: LabeledPoint[], query: {x,y} }`; params `{ k: 5, metric: "euclidean" | "manhattan" }`. Frames: `init` (start) → `measure` (all distances; tag `measure`) → `sort` (k nearest highlighted, circle of radius = k-th distance; tag `nearest`) → `vote` (counts; tag `vote`) → `decide` (tag `decide`) → `map` (region map for every grid cell, 28×28; tags `map`, `done`). Tie-break: class of the single nearest among tied classes. k clamped to `points.length`. Metrics: k, votes for each class, nearest distance.
**Scene:** 2D plot; query as a black star; lines from the query to the k nearest; radius circle (euclidean) or diamond (manhattan); vote bar inset; region map on `map`. Lab: clicking places the query (re-run).
**Controls:** presets `blobs`, `overlap`, `moons`, `three-blobs`; k slider 1–25; metric chips; draw mode with class toggle.
**Story (6):** `new-point` → `measure` → `nearest` → `vote` → `decide` → `map` ("do it everywhere").
**Break it:** k = 1 on `overlap` (islands around noise); k = all points (predicts the majority everywhere).
- [ ] NumPy fixture (predictions for 6 fixed queries × k∈{1,5,15} × both metrics on `overlap`) → tests (incl. tie-break and k clamp) → implement → scene/content → e2e → merge → push.

### Tasks 8–9 (branch `lesson/support-vector-machine`)

**Algorithm:** kernel Pegasos (Shalev-Shwartz et al.) on labels ±1: λ = 1/(C·n); for t = 1..T pick i from a mulberry32-shuffled order per epoch; `f(x_i) = (1/(λt)) Σ_j α_j y_j K(x_j, x_i)`; if `y_i f(x_i) < 1` then `α_i += 1`. Kernels: linear `x·z` (on standardised features) and RBF `exp(−γ|x−z|²)`. Bias handled by appending a constant feature 1 (linear) / adding 1 to the kernel. Params `{ C: 1, kernel: "linear", gamma: 0.5, epochs: 20, seed: 1 }`. Frames per epoch: `pick` (sample of the epoch's violations highlighted), `update`; tags `start`, `first-epoch`, `epoch-5`, `done`. Metrics: epoch, hinge loss + regulariser, support vectors (points with y·f ≤ 1 + 1e-9), accuracy. Validation: `tooFew`, `oneClass`.
**Scene:** 2D plot with region shading by sign(f), the f = 0 boundary and f = ±1 margins (`contourSegments` for RBF, exact lines for linear), support vectors ringed. Reveal: `points`, `boundary`, `margins`, `support`, `shade`.
**Controls:** presets `blobs`, `overlap`, `circles`, `moons`; kernel chips; C slider (log scale 0.01–100); γ slider (log 0.05–20, RBF only); epochs 5–60.
**Story (7):** `many-lines` → `widest-street` → `support` → `soft-margin` (C) → `learn` (epoch-5) → `kernel-trick` → `result`.
**Break it:** C = 0.01 (street too wide, many errors) vs C = 100 on `overlap`; RBF γ = 20 (islands around every point).
- [ ] NumPy fixture with the same mulberry32 order (α after epochs 1, 5, 20 for linear on `blobs` and RBF on `circles`) → tests → implement → scene/content → e2e → merge → push.

### Task 10 (on `main` after Task 9): Home + README refresh

Lesson count "5 live" appears automatically from the manifest. Update the README feature line ("Lessons 1–5 are live"), regenerate `docs/images/*.png` if the home page changed, commit, push.
