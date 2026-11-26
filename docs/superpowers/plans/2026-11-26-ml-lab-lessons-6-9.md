# ML Lab: Lessons 6–9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship lessons 6–9 (Decision Tree, Random Forest, K-Means Clustering, Principal Component Analysis), one branch each, merged to `main` and pushed when green.

**Architecture:** Same `LessonModule` + trace pattern as lessons 1–5, reusing `src/lessons/shared/` (Plot2D, ClassMarker, regionGrid, contourSegments, datasets2d, ClassDataControls, Slider). A shared CART tree builder (`src/lessons/shared/cart.ts`) serves both the decision tree and the random forest. Unsupervised lessons (K-Means, PCA) reuse the 2D datasets and ignore or only colour by the class label.

**Tech Stack:** as Plans 1–2.

**Spec:** `docs/superpowers/specs/2026-11-26-ml-lab-design.md` (§6 rows 6–9). Plans 1–2 in `docs/superpowers/plans/`.

## Global Constraints

- Everything in Plans 1–2's Global Constraints applies (static export, all text in `content/en`, logical CSS, palette, Python + pseudocode, reduced motion, keyboard paths for every pointer action, ≤ 200 KB JS per lesson page, no Claude trailers, branch per lesson merged `--no-ff` and pushed).
- Randomness only through `mulberry32` (TS) and `tools/fixtures/mulberry32.py` (Python port, bit-for-bit) so NumPy fixtures reproduce runs exactly.
- Region maps ≤ 32×32; traces ≤ 2,000 frames (`capFrames`) for anything that can grow.

## Review Focus

1. **Trees on duplicate or identical points** (no valid split, all one class): node becomes a leaf, no infinite loop. Pinned in Task 1.
2. **K-Means with k > number of distinct points or an empty cluster**: empty cluster keeps its old centroid; no NaN. Pinned in Task 5.
3. **PCA on degenerate data** (all points on a line, or identical): zero variance handled, angles finite. Pinned in Task 7.
4. **Random forest bootstrap with tiny data** (< 4 points): validation message. Pinned in Task 3.
5. **Frame growth** for deep trees × many forest trees: trace capped, page stays responsive. Pinned in Task 3.

---

### Task 1 (branch `lesson/decision-tree`): shared CART + decision-tree algorithm

**Files:** `src/lessons/shared/cart.ts` (+ test), `tools/fixtures/cart.py`, `src/lessons/decision-tree/{algorithm.ts,fixtures.json,algorithm.test.ts}`.

```ts
interface TreeNode { id: number; depth: number; indices: number[]; counts: number[]; gini: number;
  split?: { feature: 0 | 1; threshold: number; gain: number }; left?: number; right?: number; prediction: 0 | 1 | 2;
  box: { x: [number, number]; y: [number, number] } }
interface CartOptions { maxDepth: number; minLeaf: number; features?: (node: TreeNode) => (0 | 1)[] }  // features hook = random forest's feature sampling
function gini(counts: number[]): number
function bestSplit(points: LabeledPoint[], indices: number[], features: (0 | 1)[], minLeaf: number): { feature; threshold; gini; gain } | null
  // thresholds = midpoints of consecutive distinct sorted values; ties → lower weighted gini, then feature 0, then smaller threshold
function growTree(points, opts, onEvent?: (e: { kind: "scan" | "split" | "leaf"; node: TreeNode; candidates?: Candidate[] }) => void): TreeNode[]  // breadth-first
function predictTree(nodes: TreeNode[], x: number, y: number): 0 | 1 | 2
```

Decision-tree trace: `init` (start) → per node in BFS order: `scan` (best candidate per feature drawn dashed with its Gini) and `split` (tags `first-split` on the root, `depth-2` on the first depth-2 split) or `leaf` → `done`. Params `{ maxDepth: 3, minLeaf: 2 }` (limits 1–8, 1–10). Metrics: nodes, depth, accuracy, leaves.

- [ ] NumPy CART fixture on the fixed 12-point dataset and on a 3-class set (node list: feature, threshold, counts per node for depth ≤ 3) → tests: gini values, split choice incl. tie rules, BFS order, identical-points dataset terminates as a single leaf, minLeaf respected, prediction of every training point at max depth 8/minLeaf 1 = 100 % on `overlap` → implement → commit.

### Task 2 (same branch): decision-tree scene, controls, content

Scene: left = Plot2D with leaf rectangles shaded by predicted class (from node boxes), split lines (solid), candidate lines on `scan` frames (dashed + Gini labels); right = tree diagram (BFS layout, node boxes showing rule `x < 4.3` and class-count bars, current node highlighted, leaves coloured). Reveal: `points`, `regions`, `splits`, `candidates`, `tree`.
Controls: ClassDataControls (`blobs`, `overlap`, `moons`, `three-blobs`, `xor`), max depth, min leaf.
Story (6): `twenty-questions` → `one-question` (first-split) → `gini` (scan on root; Gini explained) → `split-again` (depth-2) → `stop` (done; when to stop) → `regions` (done; boxes, not lines).
Break it: max depth 8, min leaf 1 on `overlap` → islands around single points.
- [ ] Tests (reveal parts, tree node count = nodes metric, no NaN, keyboard: drawing via ClassDataControls) → content → live → build/e2e/budget → merge → push.

### Tasks 3–4 (branch `lesson/random-forest`)

**Algorithm:** `n` trees (default 15, 1–50); each tree: bootstrap sample of size n (mulberry32, seed param), CART with `maxDepth` (default 4) and feature sampling `features = [random one of 0|1]` per node (max_features = 1). Forest probability per cell = fraction of trees voting class (2-class datasets) / majority (3-class). Frames: `init` → per tree `sample` (bootstrap counts per point) → `grow` (that tree's regions) → `vote` (forest map updated) → `done`. Cap with `capFrames(…, 2000)`. Metrics: trees, accuracy (training), out-of-bag accuracy (points not in a tree's sample vote only with those trees).
**Scene:** left = forest vote shading (probability bands) + points (bootstrap duplicates drawn with a count badge on `sample` frames); right = 3×3 thumbnails of the latest nine trees' region maps (12×12 each to stay light). Reveal: `points`, `sample`, `tree`, `forest`, `thumbs`.
**Controls:** ClassDataControls (`overlap`, `moons`, `xor`, `circles`), trees, max depth, seed.
**Story (6):** `one-tree` (a single deep tree is jumpy) → `bootstrap` → `random-questions` → `crowd` (5 trees) → `vote` → `wisdom` (done; OOB accuracy).
**Break it:** 1 tree vs 50 trees on `overlap` with depth 8.
- [ ] Python fixture (mulberry32 bootstrap + feature choice + CART) for 3 trees on the fixed dataset → tests (bootstrap indices, each tree equals fixture, forest votes, OOB, validation `tooFew` < 4, trace ≤ 2000 frames at 50 trees depth 8) → implement → scene/content → merge → push.

### Tasks 5–6 (branch `lesson/k-means`)

**Algorithm:** Lloyd's. Data `{ presetId, points }` (class ignored). Params `{ k: 3, init: "random" | "plus-plus", seed: 1, maxIter: 20 }`. Init random = k distinct points chosen by mulberry32; k-means++ = standard D² sampling with mulberry32. Frames: `init` (centroids placed) → per iteration `assign` (every point coloured by nearest centroid) and `update` (centroids move to cluster means; empty cluster keeps its centroid) → stop when assignments don't change (`converged`) or maxIter → `done`. Tags: `start`, `first-assign`, `first-update`, `iter-3`, `done`. Metrics: iteration, inertia (sum of squared distances), changed (points that switched).
**Scene:** left = points coloured by cluster (up to 6 colours + shapes), centroids as large ✕ with trails, faint Voronoi map (regionGrid nearest centroid) on assign frames; right = inertia per iteration line chart. Reveal: `points`, `centroids`, `assign`, `regions`, `chart`.
**Controls:** presets (`three-blobs`, `blobs`, `moons`, `circles`, `uneven` (new: one big, two small blobs)), draw mode (unlabelled points), k 1–6, init chips, seed (re-roll button).
**Story (6):** `no-labels` → `guess-centres` → `assign` → `move` → `repeat` (iter-3) → `settle` (done).
**Break it:** seed that converges to a bad split with random init (find one in tests, mention in text generally); `moons` (k-means only makes round clusters); wrong k.
- [ ] Python fixture (mulberry32 init + Lloyd) → tests (matches, inertia never increases, empty cluster stays, convergence frame, k-means++ distinct centroids) → implement → scene/content → merge → push.

### Tasks 7–8 (branch `lesson/pca`)

**Algorithm:** 2D only. Center the data; covariance 2×2 closed form; eigen decomposition closed form (angle `θ = ½·atan2(2·cxy, cxx − cyy)`); frames: `init` (raw cloud) → `center` (shift to the mean) → `sweep` × 31 (angle 0°…180° step 6°: projected variance at that angle; tag `sweep`) → `pc1` (the maximum: first principal component; tag `pc1`) → `pc2` (perpendicular) → `project` (points slid onto PC1; tag `project`) → `done` (explained variance %). Metrics: angle, variance along angle, explained (PC1 share).
**Scene:** left = cloud with the mean, the current direction line through the mean, projections (perpendicular ticks) on sweep frames, PC1/PC2 arrows scaled by √variance, projected 1D points on `project`; right = "variance along each direction" curve over 0–180° with the current angle marker and PC1/PC2 marked, plus explained-variance bar. Reveal: `points`, `center`, `direction`, `curve`, `axes`, `project`.
**Controls:** presets (`ellipse` (new: stretched correlated cloud), `round` (new: circular), `stripes` (new: two parallel stripes, coloured by class), `three-blobs`), draw mode; components chip (1 or 2: whether to show the reconstruction error).
**Story (6):** `too-many` → `center` → `try-directions` (sweep) → `most-spread` (pc1) → `second` (pc2) → `squash` (project).
**Break it:** `stripes`: the direction with most spread is *along* the stripes, so PC1 throws away exactly the direction that separates the two classes; `round`: every direction is equal (explained ≈ 50 %).
- [ ] Python fixture (numpy eigh on fixed points: eigenvalues, eigenvector angles, projected variance at 0°, 30°, 90°) → tests (closed form = numpy; curve max = PC1; degenerate line/identical points finite) → implement → scene/content → merge → push.

### Task 9 (`docs/readme-lessons-6-9`): README line + home screenshot, merge, push.
