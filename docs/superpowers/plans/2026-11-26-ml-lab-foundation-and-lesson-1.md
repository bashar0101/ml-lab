# ML Lab: Foundation + Lesson 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Next.js site with the home page, the full lesson workspace (layout A: Learn/Lab), the trace engine, and lesson 1 (Linear Regression) complete end to end; the other 13 lessons appear as "coming soon".

**Architecture:** Every algorithm is a pure TypeScript function that returns a `Trace` (a list of recorded `Frame`s). A lesson's `Scene` renders one frame as SVG; the workspace's player only moves an index through the frames. Learn story steps point at frame tags; Lab re-runs the algorithm when data or params change. All text lives in `content/en/*.json`, validated with zod at build time.

**Tech Stack:** Next.js 16.4 (App Router, `output: "export"`), React 19, TypeScript (the version create-next-app pins), CSS Modules + CSS variables (no Tailwind), zod 4, Vitest 5 + Testing Library + jsdom, Playwright 1.65, NumPy (fixture script only).

**Spec:** `docs/superpowers/specs/2026-11-26-ml-lab-design.md`

## Global Constraints

- Fully static: `next build` must produce `out/` with no server features (no route handlers needing runtime, no middleware, no `next/image` optimisation).
- All UI text comes from `content/en/ui.json` or the lesson's content file. No hard-coded English strings in components (aria labels included).
- English URLs have no locale prefix: `/`, `/lessons/<slug>/`, `/about/`. Use `trailingSlash: true`.
- CSS uses logical properties only (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`); no `left`/`right` in layout CSS. SVG coordinates are exempt.
- Palette (light): `--bg #f1e9dd`, `--panel #f9f3ea`, `--card #fdf9f2`, `--ink #1d1b18`, `--ink-2 #4a453e`, `--muted #7a7268`, `--line #dccfbe`, `--line-2 #c4b7a5`, `--green #cfe3b2`, `--peach #fbdcbc`, `--lavender #e3dbf0`, `--blue #2c62d6`, `--red #c0392b`. Chapter swatches: foundations `#d9a866`, classification `#5d9a4e`, trees `#7a5bc0`, patterns `#d0683a`, neural `#2f7fc4`, deep `#c9496b`.
- Fonts: JetBrains Mono (UI, code), Instrument Serif (page and lesson titles, italic for emphasis), system sans for body. Self-hosted via `next/font/google`.
- Buttons: 1.5px ink border, `box-shadow: 0 2px 0 var(--ink)`, pressed state translates 2px down with no shadow.
- Python + pseudocode code tabs only.
- No analytics, no network requests at runtime.
- `prefers-reduced-motion: reduce` → no tweening, instant frame changes, home demo shows a still final frame.
- Everything keyboard-reachable; story text in an `aria-live="polite"` region; colours never the only signal.
- Lesson page JS ≤ 200 KB gzipped (checked by `scripts/check-budget.mjs`).
- Work happens in a new local git repo; `.superpowers/`, `node_modules/`, `.next/`, `out/`, `test-results/` are git-ignored.

## Review Focus

1. **Extreme learning rate** (e.g. 1.2 or a hand-edited 50): the run must stop with a `diverged` frame instead of producing `NaN`/`Infinity`, stat chips show "too big", and the SVG has no `NaN` attributes. Pinned in Task 5 and Task 6.
2. **Degenerate "draw your own" data** (0 points, 1 point, or all points with the same x): `std` is 0. Expected: Lab shows a message and keeps the previous trace. Pinned in Task 5 and Task 9.
3. **Blocked or corrupt `localStorage`** (private mode throws; stored JSON is garbage): the site works and progress starts empty. Pinned in Task 4.
4. **Hand-edited deep links** (`#step-99`, `#step-0`, `#step-abc`, `#LAB`): clamp to the valid range or fall back to Learn step 1, never crash. Pinned in Task 4.
5. **Changing params or mode while playing:** playback stops, index resets to 0, no stale timer keeps advancing. Pinned in Task 4 (reducer) and Task 9 (workspace).

---

## File structure

```
next.config.ts                     static export config
vitest.config.mts, playwright.config.ts
content/en/ui.json                 all UI strings, chapter and lesson titles, home FAQ
content/en/lessons/linear-regression.json
src/app/layout.tsx                 fonts, theme bootstrap script, TopBar, UiProvider
src/app/page.tsx                   home
src/app/lessons/[slug]/page.tsx    lesson route (generateStaticParams over live lessons)
src/app/about/page.tsx, src/app/not-found.tsx, src/app/sitemap.ts, src/app/robots.ts
src/styles/tokens.css, src/styles/globals.css
src/course/manifest.ts             chapters + 14 lessons, order, status
src/content/schema.ts              zod schemas
src/content/load.ts                loadUi(locale), loadLesson(locale, slug)
src/i18n/ui-context.tsx            UiProvider, useT()
src/engine/types.ts                Frame, Trace
src/engine/random.ts               mulberry32
src/engine/cap.ts                  capFrames
src/engine/text.ts                 interpolate()
src/components/Markdownish.tsx     **bold** *italic* `code` only
src/state/player.ts                playerReducer + usePlayer
src/state/hash.ts                  parseHash / formatHash
src/state/progress.ts              progress store over Storage
src/state/keys.ts                  useLessonKeys
src/state/theme.ts                 resolveTheme + bootstrap script string
src/lessons/types.ts               LessonModule interface
src/lessons/registry.ts            slug → dynamic import
src/lessons/linear-regression/     algorithm.ts, surface.ts, presets.ts, code.ts, Scene.tsx, LabControls.tsx, index.ts, fixtures.json
src/components/workspace/          LessonWorkspace, CourseTree, StoryCard, StepRail, StatChips, ModeSwitch, LabPanel, Player, CodePanel (+ *.module.css)
src/components/                    TopBar, ThemeToggle, LessonArticle, HeroDemo, ChapterCards
tools/fixtures/linear_regression.py
scripts/check-budget.mjs
e2e/lesson.spec.ts, e2e/home.spec.ts
```

Tests are colocated (`*.test.ts(x)` next to the file).

---

### Task 1: Project skeleton, tokens, theme, top bar

**Files:**
- Create: project via create-next-app; `next.config.ts`, `vitest.config.mts`, `playwright.config.ts`, `.gitignore` additions, `src/styles/tokens.css`, `src/styles/globals.css`, `src/state/theme.ts`, `src/state/theme.test.ts`, `src/components/TopBar.tsx`, `src/components/ThemeToggle.tsx`, `src/app/layout.tsx`
- Test: `src/state/theme.test.ts`

**Interfaces:**
- Produces: `type Theme = "light" | "dark"`; `resolveTheme(stored: string | null, systemDark: boolean): Theme`; `THEME_KEY = "mllab:theme"`; `themeBootstrapScript: string` (inline script setting `document.documentElement.dataset.theme` before paint); CSS variables from Global Constraints on `:root`, dark values under `:root[data-theme="dark"]`.

- [ ] **Step 1: Scaffold.** In `C:\projects\ml-lab` run `npx create-next-app@16.4 . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm` then `git init` and add `.superpowers/`, `out/`, `test-results/`, `playwright-report/` to `.gitignore`. Install dev deps: `npm i -D vitest@5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vite-tsconfig-paths @playwright/test@1.65 serve@14` and `npm i zod@4`.
- [ ] **Step 2: Config.** `next.config.ts`: `{ output: "export", trailingSlash: true, images: { unoptimized: true } }`. `vitest.config.mts`: plugins `react()`, `tsconfigPaths()`; `test.environment = "jsdom"`, `test.setupFiles = ["@testing-library/jest-dom/vitest"]`, `test.include = ["src/**/*.test.{ts,tsx}"]`. `playwright.config.ts`: `webServer: { command: "npx serve out -l 3100", port: 3100 }`, `use.baseURL = "http://localhost:3100"`, projects `desktop` (1440×900) and `phone` (390×844). Scripts: `"test": "vitest run"`, `"e2e": "playwright test"`, `"budget": "node scripts/check-budget.mjs"`.
- [ ] **Step 3: Write the failing test** `src/state/theme.test.ts`:

```ts
it("uses stored theme when valid", () => {
  expect(resolveTheme("dark", false)).toBe("dark");
  expect(resolveTheme("light", true)).toBe("light");
});
it("falls back to system preference for missing or invalid values", () => {
  expect(resolveTheme(null, true)).toBe("dark");
  expect(resolveTheme("purple", false)).toBe("light");
});
```

- [ ] **Step 4: Run** `npx vitest run src/state/theme.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 5: Implement** `src/state/theme.ts`. `themeBootstrapScript` wraps the `localStorage` read in try/catch and uses `matchMedia("(prefers-color-scheme: dark)")`.
- [ ] **Step 6: Styles and shell.** `tokens.css` holds all palette variables plus a warm dark palette (builder's values; must keep AA contrast) and `color-scheme`. `globals.css`: body background `var(--bg)`, base type, `.btn` pattern, focus ring (2px `--blue` outline), reduced-motion rule disabling transitions. `layout.tsx`: loads `JetBrains_Mono` and `Instrument_Serif` (weights 400, styles normal+italic) via `next/font/google` as CSS variables `--font-mono`/`--font-serif`, injects `themeBootstrapScript` in `<head>`, `<html lang="en" suppressHydrationWarning>`, renders `TopBar` (logo "ML *Lab*" in serif with green underline highlight, a search button placeholder that is `disabled` for now, `ThemeToggle`). TopBar strings temporarily as props; Task 2 moves them to `ui.json`.
- [ ] **Step 7: Run** `npx vitest run` → PASS; `npx next build` → succeeds and `out/index.html` exists.
- [ ] **Step 8: Commit** `git add -A && git commit -m "chore: scaffold Next.js static site with tokens and theme"`.

---

### Task 2: Course manifest, content schema, UI strings

**Files:**
- Create: `src/course/manifest.ts`, `src/course/manifest.test.ts`, `src/content/schema.ts`, `src/content/load.ts`, `src/content/load.test.ts`, `src/i18n/ui-context.tsx`, `content/en/ui.json`, `src/content/__fixtures__/lesson.valid.json`
- Modify: `src/components/TopBar.tsx`, `src/components/ThemeToggle.tsx`, `src/app/layout.tsx` (read strings via `useT`)

**Interfaces:**
- Produces:
  - `type ChapterId = "foundations" | "classification" | "trees" | "patterns" | "neural" | "deep"`
  - `interface Chapter { id: ChapterId; number: string; color: string }` (`number` like `"01"`, `color` a hex)
  - `interface LessonEntry { slug: string; chapter: ChapterId; status: "live" | "soon"; minutes: number; level: "beginner" | "intermediate" }`
  - `chapters: Chapter[]`, `lessons: LessonEntry[]` (course order), `liveLessons(): LessonEntry[]`, `lessonsInChapter(id): LessonEntry[]`, `nextLesson(slug): LessonEntry | undefined`, `lessonIndex(slug): number` (1-based)
  - `LessonContentSchema`, `type LessonContent`, `UiSchema`, `type UiStrings = Record<string, string>`
  - `loadUi(locale: string): Promise<UiStrings>`, `loadLesson(locale: string, slug: string): Promise<LessonContent>`; both read `content/<locale>/…` with `fs/promises` (server-only) and throw `Error("Invalid content: <file>: <zod issue path>")`
  - `DEFAULT_LOCALE = "en"`, `<UiProvider strings>`, `useT(): (key: string, vars?: Record<string, string | number>) => string`; a missing key returns the key itself and `console.warn`s in development

Manifest values (course order):

| slug | chapter | minutes | level | status |
|---|---|---|---|---|
| linear-regression | foundations | 8 | beginner | live |
| gradient-descent | foundations | 10 | beginner | soon |
| logistic-regression | classification | 10 | beginner | soon |
| k-nearest-neighbors | classification | 8 | beginner | soon |
| support-vector-machine | classification | 12 | intermediate | soon |
| decision-tree | trees | 10 | beginner | soon |
| random-forest | trees | 10 | intermediate | soon |
| k-means | patterns | 8 | beginner | soon |
| pca | patterns | 10 | intermediate | soon |
| neural-network | neural | 12 | intermediate | soon |
| backpropagation | neural | 12 | intermediate | soon |
| convolutional-neural-network | deep | 14 | intermediate | soon |
| recurrent-neural-network | deep | 12 | intermediate | soon |
| attention-transformers | deep | 15 | intermediate | soon |

`LessonContentSchema` (zod; `md` = non-empty string using the Markdownish subset):

```ts
{
  title: string, description: string.max(160), youWillLearn: md[3..6],
  story: { id: string, rail: string.max(14), title: md, body: md, keyIdea: md,
           math?: md, frameTag: string, reveal: string[] }[6..10],
  events: Record<string, { title: md, body: md }>,          // body may contain {metric} placeholders
  stats: Record<string, string>,                            // stat chip labels by key
  lab: { breakIt: md, presets: Record<string, string>,
         params: Record<string, { label: string, hint?: md }>,
         errors: Record<string, md> },                      // validation messages by key
  article: { sections: { heading: string, body: md,
                         table?: { headers: string[], rows: string[][] } }[3..],
             faq: { q: string, a: md }[3..] }
}
```

Lesson titles (`lesson.<slug>.title`, exact): Linear Regression, Gradient Descent, Logistic Regression, k-Nearest Neighbors, Support Vector Machine, Decision Tree, Random Forest, K-Means Clustering, Principal Component Analysis, Neural Network, Backpropagation, Convolutional Neural Network, Recurrent Neural Network, Attention & Transformers. Chapter titles (`chapter.<id>`): Foundations, Classification, Trees & Forests, Finding Patterns, Neural Networks, Deep Learning. Fixed labels: `site.name` "ML Lab", `mode.learn` "Learn", `mode.lab` "Lab", `player.first` "First", `player.back` "Previous frame", `player.play` "Play", `player.pause` "Pause", `player.next` "Next frame", `player.last` "Last", `player.scrubber` "Training step", `menu.open` "Open course menu", `menu.close` "Close course menu".

`ui.json` must contain at least: `site.name`, `site.tagline`, `nav.search`, `theme.toLight`, `theme.toDark`, `chapter.<id>` for all 6 chapters, `lesson.<slug>.title` for all 14 lessons, `level.beginner`, `level.intermediate`, `lesson.minutes` (`"{n} min"`), `lesson.comingSoon`, `course.heading`, `course.lessons` (`"{n} lessons"`), `progress.label`, `mode.learn`, `mode.lab`, `story.stepOf` (`"Step {n} / {total}"`), `story.keyIdea`, `story.showMath`, `story.back`, `story.next` (`"Next: {name}"`), `story.toLab` (`"Try it in the lab"`), `youWillLearn.heading`, `player.*` (first, back, play, pause, next, last, speed, scrubber), `lab.yourData`, `lab.breakIt`, `lab.invalidData`, `code.heading`, `code.python`, `code.pseudocode`, `code.copy`, `code.copied`, `now.heading`, `stat.tooBig`, `menu.open`, `menu.close`, `article.keepLearning`, `article.faq`, `home.*` (eyebrow, title, subtitle, start, allLessons, faqTitle), `home.faq` items as `home.faq.<n>.q` / `.a` for n = 1..4, `about.*`, `notFound.*`.

- [ ] **Step 1: Write the failing tests.**

```ts
// manifest.test.ts
it("has 6 chapters and 14 lessons in course order", () => {
  expect(chapters.map(c => c.id)).toEqual(["foundations","classification","trees","patterns","neural","deep"]);
  expect(lessons).toHaveLength(14);
  expect(new Set(lessons.map(l => l.slug)).size).toBe(14);
  expect(lessons[0].slug).toBe("linear-regression");
});
it("only lesson 1 is live", () => {
  expect(liveLessons().map(l => l.slug)).toEqual(["linear-regression"]);
});
it("nextLesson walks course order and ends", () => {
  expect(nextLesson("linear-regression")?.slug).toBe("gradient-descent");
  expect(nextLesson("attention-transformers")).toBeUndefined();
});
// load.test.ts
it("ui.json has a title for every lesson and chapter", async () => {
  const ui = await loadUi("en");
  for (const l of lessons) expect(ui[`lesson.${l.slug}.title`]).toBeTruthy();
  for (const c of chapters) expect(ui[`chapter.${c.id}`]).toBeTruthy();
});
it("accepts a valid lesson fixture and rejects a story with 5 steps", () => {
  const ok = LessonContentSchema.safeParse(validFixture);
  expect(ok.success).toBe(true);
  expect(LessonContentSchema.safeParse({ ...validFixture, story: validFixture.story.slice(0, 5) }).success).toBe(false);
});
it("loadLesson names the file on invalid content", async () => {
  await expect(loadLesson("en", "does-not-exist")).rejects.toThrow(/does-not-exist/);
});
```

- [ ] **Step 2: Run** `npx vitest run src/course src/content` → FAIL.
- [ ] **Step 3: Implement** manifest, schema, loader, `ui.json` (all text in plain English, friendly, school level) and `UiProvider`/`useT` (`{name}` placeholders replaced via `interpolate` from Task 3; implement a local replace now and switch to `interpolate` in Task 3). Move TopBar/ThemeToggle strings to `useT`.
- [ ] **Step 4: Run** `npx vitest run` → PASS; `npx next build` → succeeds.
- [ ] **Step 5: Commit** `feat: course manifest, content schema and UI strings`.

---

### Task 3: Engine primitives and safe text

**Files:**
- Create: `src/engine/types.ts`, `src/engine/random.ts`, `src/engine/cap.ts`, `src/engine/text.ts`, `src/components/Markdownish.tsx`, tests for each
- Modify: `src/i18n/ui-context.tsx` (use `interpolate`)

**Interfaces:**
- Produces:

```ts
interface Frame<S> { state: S; codeLine: string; event: string;
                     metrics: Record<string, number>; tags: string[] }
interface Trace<S> { frames: Frame<S>[]; meta: { algorithm: string; seed: number; truncated: boolean } }
function mulberry32(seed: number): () => number               // [0, 1)
function capFrames<S>(frames: Frame<S>[], max: number): { frames: Frame<S>[]; truncated: boolean }
function frameIndexOfTag<S>(trace: Trace<S>, tag: string): number   // first match, -1 if none
function interpolate(template: string, vars: Record<string, string | number>,
                     format?: (key: string, v: number) => string): string
function Markdownish(props: { text: string; inline?: boolean }): JSX.Element
```

`capFrames` keeps the first frame, the last frame and every frame with a non-empty `tags`, then fills the remaining budget with evenly spaced frames, preserving order. If tagged frames alone exceed `max`, it keeps all of them (exceeding `max`). `interpolate` replaces `{key}`; numbers go through `format` (default: up to 2 decimals); unknown keys stay as literal `{key}`. `Markdownish` supports only `**bold**`, `*italic*`, `` `code` `` and blank-line paragraphs (block mode); everything else renders as text (never `dangerouslySetInnerHTML`).

- [ ] **Step 1: Write the failing tests.**

```ts
it("mulberry32 is deterministic per seed", () => {
  const a = mulberry32(7), b = mulberry32(7);
  expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  expect(mulberry32(8)()).not.toBe(mulberry32(7)());
});
it("capFrames keeps first, last and tagged frames in order", () => {
  const f = Array.from({ length: 5000 }, (_, i) => frame(i, i === 1234 ? ["x"] : []));
  const { frames, truncated } = capFrames(f, 2000);
  expect(truncated).toBe(true);
  expect(frames.length).toBeLessThanOrEqual(2000);
  expect(frames[0].state).toBe(0); expect(frames.at(-1)!.state).toBe(4999);
  expect(frames.some(x => x.state === 1234)).toBe(true);
  expect(frames.map(x => x.state)).toEqual([...frames.map(x => x.state)].sort((a, b) => a - b));
});
it("capFrames is a no-op under the cap", () => {
  expect(capFrames([frame(0, []), frame(1, [])], 10)).toEqual({ frames: [frame(0, []), frame(1, [])], truncated: false });
});
it("interpolate fills, formats and leaves unknown keys", () => {
  expect(interpolate("Loss {loss} at {step}", { loss: 3.14159, step: 4 })).toBe("Loss 3.14 at 4");
  expect(interpolate("{nope}", {})).toBe("{nope}");
});
it("Markdownish renders bold/italic/code and escapes HTML", () => {
  render(<Markdownish text={"**a** *b* `c` <img src=x onerror=alert(1)>"} inline />);
  expect(screen.getByText("a").tagName).toBe("STRONG");
  expect(screen.getByText("b").tagName).toBe("EM");
  expect(screen.getByText("c").tagName).toBe("CODE");
  expect(document.querySelector("img")).toBeNull();
});
```

- [ ] **Step 2: Run** `npx vitest run src/engine src/components` → FAIL.
- [ ] **Step 3: Implement** the five files. `mulberry32` is the standard 32-bit mulberry32 generator.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: trace engine primitives and safe markdown text`.

---

### Task 4: Lesson state: player, deep links, progress, keys

**Files:**
- Create: `src/state/player.ts`, `src/state/hash.ts`, `src/state/progress.ts`, `src/state/keys.ts`, tests for each

**Interfaces:**
- Produces:

```ts
interface PlayerState { index: number; length: number; playing: boolean; speed: number; target: number | null }
type PlayerAction =
  | { type: "play" } | { type: "pause" } | { type: "toggle" }
  | { type: "next" } | { type: "prev" } | { type: "first" } | { type: "last" }
  | { type: "seek"; index: number } | { type: "speed"; speed: number }
  | { type: "load"; length: number }          // new trace: index 0, stopped
  | { type: "playTo"; index: number }          // animate to index then stop
  | { type: "tick" }                           // advance one frame toward target or end
function playerReducer(s: PlayerState, a: PlayerAction): PlayerState
function usePlayer(length: number): [PlayerState, Dispatch<PlayerAction>]   // drives "tick" with setInterval(BASE_MS / speed); BASE_MS = 120
SPEEDS = [0.25, 0.5, 1, 2, 4]

type Mode = "learn" | "lab"
function parseHash(hash: string, storyLength: number): { mode: Mode; step: number }   // step is 0-based
function formatHash(mode: Mode, step: number): string   // "#step-<n+1>" for learn, "#lab" for lab; step 0 in learn → ""

interface LessonProgress { lastStep: number; completed: boolean }
function createProgressStore(storage: Storage | null): {
  get(slug: string): LessonProgress;           // default { lastStep: 0, completed: false }
  reachStep(slug: string, step: number): void; // keeps the max
  complete(slug: string): void;
  completedCount(): number;
}
PROGRESS_KEY = "mllab:progress"
function browserStorage(): Storage | null      // null if access throws

function useLessonKeys(h: { next(): void; prev(): void; togglePlay(): void; replay(): void; toggleMode(): void }): void
// ArrowRight, ArrowLeft, Space, "r", "l"; ignored when event target is input/textarea/select/contenteditable or a modifier key is held
```

`playerReducer` rules: all indices clamp to `[0, length-1]`; `play` at the last frame restarts from 0; reaching the end or `target` sets `playing=false, target=null`; `load` resets to `{ index: 0, playing: false, target: null }` keeping `speed`; `seek`/`next`/`prev`/`first`/`last` stop playback. With `prefers-reduced-motion`, `usePlayer` turns `playTo` into an immediate `seek`.

- [ ] **Step 1: Write the failing tests.**

```ts
it("playTo animates to the target and stops there", () => {
  let s = playerReducer(init(121), { type: "playTo", index: 3 });
  for (let i = 0; i < 10; i++) s = playerReducer(s, { type: "tick" });
  expect(s).toMatchObject({ index: 3, playing: false, target: null });
});
it("playTo backwards walks down", () => {
  let s = playerReducer({ ...init(121), index: 10 }, { type: "playTo", index: 2 });
  s = playerReducer(s, { type: "tick" });
  expect(s.index).toBe(9);
});
it("load resets and stops even while playing", () => {
  const s = playerReducer({ ...init(121), index: 50, playing: true, speed: 2 }, { type: "load", length: 30 });
  expect(s).toEqual({ index: 0, length: 30, playing: false, speed: 2, target: null });
});
it("seek clamps and stops", () => {
  expect(playerReducer({ ...init(10), playing: true }, { type: "seek", index: 99 })).toMatchObject({ index: 9, playing: false });
});
it("play at the end restarts from 0", () => {
  expect(playerReducer({ ...init(10), index: 9 }, { type: "play" })).toMatchObject({ index: 0, playing: true });
});

it.each([
  ["", "learn", 0], ["#step-4", "learn", 3], ["#step-99", "learn", 5], ["#step-0", "learn", 0],
  ["#step-abc", "learn", 0], ["#lab", "lab", 0], ["#LAB", "lab", 0], ["#whatever", "learn", 0],
])("parseHash(%s)", (h, mode, step) => expect(parseHash(h, 6)).toEqual({ mode, step }));
it("formatHash round-trips", () => expect(parseHash(formatHash("learn", 3), 6)).toEqual({ mode: "learn", step: 3 }));

it("progress survives a throwing storage", () => {
  const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } as unknown as Storage;
  const p = createProgressStore(bad);
  expect(p.get("linear-regression")).toEqual({ lastStep: 0, completed: false });
  expect(() => p.complete("linear-regression")).not.toThrow();
});
it("progress ignores corrupt JSON and keeps the max step", () => {
  const s = memoryStorage({ "mllab:progress": "{not json" });
  const p = createProgressStore(s);
  p.reachStep("linear-regression", 4); p.reachStep("linear-regression", 2);
  expect(p.get("linear-regression").lastStep).toBe(4);
});

it("keys ignore typing in inputs", async () => {
  const next = vi.fn(); renderHook(() => useLessonKeys({ next, prev: vi.fn(), togglePlay: vi.fn(), replay: vi.fn(), toggleMode: vi.fn() }));
  const input = document.body.appendChild(document.createElement("input"));
  fireEvent.keyDown(input, { key: "ArrowRight" }); expect(next).not.toHaveBeenCalled();
  fireEvent.keyDown(document.body, { key: "ArrowRight" }); expect(next).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run** `npx vitest run src/state` → FAIL.
- [ ] **Step 3: Implement** the four files.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: player, deep links, progress and keyboard state`.

---

### Task 5: Linear regression algorithm, fixtures, loss surface geometry

**Files:**
- Create: `tools/fixtures/linear_regression.py`, `src/lessons/linear-regression/fixtures.json` (generated), `src/lessons/linear-regression/presets.ts`, `src/lessons/linear-regression/algorithm.ts`, `src/lessons/linear-regression/algorithm.test.ts`, `src/lessons/linear-regression/surface.ts`, `src/lessons/linear-regression/surface.test.ts`

**Interfaces:**
- Consumes: `Frame`, `Trace` (Task 3).
- Produces:

```ts
interface Point { x: number; y: number }
interface LrParams { learningRate: number; steps: number; initW: number; initB: number }
interface LrState { w: number; b: number; iteration: number; mean: number; std: number }
const LR_DEFAULTS: LrParams = { learningRate: 0.1, steps: 40, initW: -10, initB: 20 };
const LR_LIMITS = { learningRate: { min: 0.01, max: 1.2, step: 0.01 }, steps: { min: 10, max: 200 } };
function validateData(points: Point[]): null | "tooFew" | "sameX"   // < 2 points → tooFew; std(x) === 0 → sameX
function runLinearRegression(points: Point[], p: LrParams): Trace<LrState>  // throws if validateData fails
function lrLoss(points: Point[], w: number, b: number, mean: number, std: number): number
function toLine(s: LrState): { slope: number; intercept: number }          // original units
PRESETS: { id: "study-hours" | "house-prices" | "outlier"; points: Point[]; xLabelKey: string; yLabelKey: string }[]

interface SurfacePolygon { points: [number, number][]; height: number }   // height 0..1
function buildSurface(loss: (w: number, b: number) => number, wRange: [number, number],
                      bRange: [number, number], n: number): SurfacePolygon[]  // n×n cells, back-to-front
function isoProject(w: number, b: number, z: number, box: SurfaceBox): [number, number]
interface SurfaceBox { wRange: [number, number]; bRange: [number, number]; origin: [number, number]; size: number; heightScale: number }
function surfaceRanges(points: Point[], trace: Trace<LrState>): { wRange: [number, number]; bRange: [number, number] }
// ranges centred on the least-squares optimum, wide enough to include the start point plus 15 % margin; diverged frames are excluded
```

The algorithm (matches the Python shown to students exactly; population std, ddof 0):

```
x_i = (raw_x_i - mean) / std
frame 0: event "init", codeLine "init", tags ["start"]
for i in 1..steps:
  frame: event "predict", codeLine "predict"          (state unchanged)
  frame: event "error",   codeLine "error"
  gw = 2 * mean(err * x); gb = 2 * mean(err); w -= lr*gw; b -= lr*gb
  frame: event "update" (or "overshoot" if loss rose), codeLine "update",
         tags: i==1 → ["first-update"], i==8 → ["update-8"]
  if !isFinite(loss) or loss > 1e9: frame event "diverged", codeLine "update", tags ["diverged","done"]; stop
final frame: event "done", codeLine "return", tags ["done"]
metrics on every frame: { loss, iteration, slope, intercept }
```

Presets (exact data):
- `study-hours`: x = 1..9, y = 42, 48, 50, 61, 63, 70, 72, 83, 85 (labels `lr.axis.hours`, `lr.axis.score`)
- `house-prices`: (50,150) (60,180) (70,195) (80,230) (90,240) (100,275) (110,290) (120,330) (130,345) (140,370) (labels `lr.axis.size`, `lr.axis.price`)
- `outlier`: study-hours plus (8.5, 15)

- [ ] **Step 1: Write the fixture script** `tools/fixtures/linear_regression.py`: defines `train(hours, y, lr, steps, w, b)` with the exact Python from Task 6's code panel, runs it on all three presets with `LR_DEFAULTS`, records `w, b` after step 1, after step 8 and after the last step, and the `np.polyfit(x, y, 1)` least-squares slope/intercept; writes JSON to `src/lessons/linear-regression/fixtures.json`. Run `python tools/fixtures/linear_regression.py`. Expected: file written with 3 entries.
- [ ] **Step 2: Write the failing tests.**

```ts
it.each(PRESETS)("matches NumPy on %s", (preset) => {
  const fx = fixtures[preset.id];
  const t = runLinearRegression(preset.points, LR_DEFAULTS);
  const at = (tag: string) => t.frames[frameIndexOfTag(t, tag)].state;
  expect(at("first-update").w).toBeCloseTo(fx.step1.w, 9);
  expect(at("update-8").b).toBeCloseTo(fx.step8.b, 9);
  expect(toLine(t.frames.at(-1)!.state).slope).toBeCloseTo(fx.lstsq.slope, 2);   // converges to least squares
});
it("emits 1 + 3*steps + 1 frames with the right code lines", () => {
  const t = runLinearRegression(PRESETS[0].points, LR_DEFAULTS);
  expect(t.frames).toHaveLength(122);
  expect(t.frames.slice(1, 4).map(f => f.codeLine)).toEqual(["predict", "error", "update"]);
  expect(t.frames.at(-1)).toMatchObject({ event: "done", codeLine: "return", tags: ["done"] });
});
it("stops with a diverged frame instead of producing NaN", () => {
  const t = runLinearRegression(PRESETS[0].points, { ...LR_DEFAULTS, learningRate: 50, steps: 200 });
  const last = t.frames.at(-1)!;
  expect(last.event).toBe("diverged");
  expect(last.tags).toContain("done");
  for (const f of t.frames.slice(0, -1)) expect(Number.isFinite(f.metrics.loss)).toBe(true);
});
it("lr 1.2 overshoots: loss rises and an overshoot event appears", () => {
  const t = runLinearRegression(PRESETS[0].points, { ...LR_DEFAULTS, learningRate: 1.2 });
  expect(t.frames.some(f => f.event === "overshoot")).toBe(true);
});
it.each([[[], "tooFew"], [[{ x: 1, y: 2 }], "tooFew"], [[{ x: 3, y: 1 }, { x: 3, y: 9 }], "sameX"]])(
  "validateData(%j) = %s", (pts, err) => expect(validateData(pts as Point[])).toBe(err));
it("buildSurface returns n*n polygons ordered back to front", () => {
  const polys = buildSurface((w, b) => w * w + b * b, [-1, 1], [-1, 1], 14);
  expect(polys).toHaveLength(196);
  const depth = (p: SurfacePolygon) => Math.max(...p.points.map(q => q[1]));
  expect(depth(polys[0])).toBeLessThanOrEqual(depth(polys.at(-1)!) + 1e-9);
  for (const p of polys) expect(p.height).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 3: Run** `npx vitest run src/lessons/linear-regression` → FAIL.
- [ ] **Step 4: Implement** `presets.ts`, `algorithm.ts`, `surface.ts`. Surface height = `sqrt(loss - minLoss)` normalised to 0..1 over the grid (the softened bowl from the mockup); painter's order sorts by `w + b` grid index (the isometric view looks from the far corner).
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** `feat: linear regression algorithm verified against NumPy`.

---

### Task 6: Linear regression module: scene, lab controls, code, registry

**Files:**
- Create: `src/lessons/types.ts`, `src/lessons/registry.ts`, `src/lessons/linear-regression/Scene.tsx`, `Scene.module.css`, `LabControls.tsx`, `code.ts`, `index.ts`, `Scene.test.tsx`

**Interfaces:**
- Consumes: Task 3 types, Task 5 algorithm/surface/presets, `useT`.
- Produces:

```ts
interface CodeLine { text: string; key?: string }
interface SceneProps<S, D> { trace: Trace<S>; index: number; data: D; reveal: ReadonlySet<string> | "all" }
interface LabControlsProps<P, D> { params: P; data: D; onParams(p: P): void; onData(d: D): void; error: string | null }
interface StatChip { labelKey: string; value: number | null }        // null → "too big"
interface LessonModule<S = unknown, P = unknown, D = unknown> {
  slug: string;
  defaultParams: P;
  defaultData: D;
  validate(data: D): string | null;           // returns a content key under lab, e.g. "tooFew"
  run(data: D, params: P): Trace<S>;
  Scene: ComponentType<SceneProps<S, D>>;
  LabControls: ComponentType<LabControlsProps<P, D>>;
  code: { python: CodeLine[]; pseudo: CodeLine[] };
  stats(frame: Frame<S>): StatChip[];
}
function loadLessonModule(slug: string): Promise<LessonModule>       // registry: { "linear-regression": () => import("./linear-regression") }
function hasLessonModule(slug: string): boolean
```

Code panel text (exact; `key` in brackets, not shown):

```
def train(hours, y, lr=0.1, steps=40):
    x = (hours - hours.mean()) / hours.std()      [init]
    w, b = -10.0, 20.0                            [init]
    for step in range(steps):
        guess = w * x + b                         [predict]
        error = guess - y                         [error]
        w -= lr * 2 * (error * x).mean()          [update]
        b -= lr * 2 * error.mean()                [update]
    return w, b                                   [return]
```

Pseudocode:

```
scale x so its mean is 0 and spread is 1        [init]
start with a random line: w = −10, b = 20       [init]
repeat steps times:
    guess ← w·x + b for every point             [predict]
    error ← guess − real value                  [error]
    nudge w and b a little downhill             [update]
return the line                                  [return]
```

Scene (viewBox `0 0 780 395`, as in the approved mockup): left half a scatter plot (axes, ticks, axis labels from `xLabelKey`/`yLabelKey`), peach points with ink outline, blue model line (`toLine`), dashed red residual sticks; right half the isometric loss bowl (`buildSurface`, 14×14 cells, colours green→peach→lavender by height) with the descent path (ink polyline + small dots) and an orange current-position dot. Reveal keys: `points`, `line`, `residuals`, `bowl`, `path`. Residuals are always shown on `error` frames when `residuals` is revealed. Line coordinates are clamped to ±2000 SVG units; the path uses only finite frames and clamps into the surface box. The SVG has `role="img"` and an `aria-label` from `lr.scene.label`. Stats: `step` (iteration / steps), `loss` (null when > 1e6), `slope`.

LabControls: preset chips (`lab.presets` labels), a "Draw your own" toggle where clicking the scatter adds a point and clicking a point removes it (data goes through `onData`), learning-rate slider (`LR_LIMITS`), steps slider, the break-it hint, and `error` text when non-null.

- [ ] **Step 1: Write the failing tests** (`Scene.test.tsx`):

```ts
import mod from "./index";
it("renders a frame with no NaN or Infinity in any attribute", () => {
  const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 50, steps: 200 });
  const { container } = render(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
  for (const el of container.querySelectorAll("*"))
    for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
});
it("hides residuals and line until revealed", () => {
  const t = mod.run(mod.defaultData, mod.defaultParams);
  const { container } = render(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal={new Set(["points"])} />);
  expect(container.querySelectorAll("[data-part=point]")).toHaveLength(9);
  expect(container.querySelector("[data-part=line]")).toBeNull();
  expect(container.querySelector("[data-part=residual]")).toBeNull();
});
it("every frame's codeLine exists in both code tabs", () => {
  const keys = (ls: CodeLine[]) => new Set(ls.map(l => l.key).filter(Boolean));
  const t = mod.run(mod.defaultData, mod.defaultParams);
  for (const f of t.frames) {
    expect(keys(mod.code.python)).toContain(f.codeLine);
    expect(keys(mod.code.pseudo)).toContain(f.codeLine);
  }
});
it("loss stat is null (too big) on a diverged frame", () => {
  const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 50, steps: 200 });
  expect(mod.stats(t.frames.at(-1)!).find(s => s.labelKey === "loss")!.value).toBeNull();
});
it("registry loads linear-regression", async () => {
  expect((await loadLessonModule("linear-regression")).slug).toBe("linear-regression");
  expect(hasLessonModule("pca")).toBe(false);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** types, registry, `code.ts`, `Scene.tsx` (+ `data-part` attributes `point`, `line`, `residual`, `bowl`, `path`, `current`), `LabControls.tsx`, `index.ts` (default export the `LessonModule`). Scene strings go through `useT`; tests wrap renders in `UiProvider` with `content/en/ui.json`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: linear regression scene, lab controls and code`.

---

### Task 7: Lesson 1 content and content contract tests

**Files:**
- Create: `content/en/lessons/linear-regression.json`, `src/content/contract.test.ts`
- Modify: `content/en/ui.json` (`lr.*` keys: axis labels, scene label)

**Interfaces:**
- Consumes: `loadLesson`, `liveLessons`, `loadLessonModule`, `frameIndexOfTag`.

Story (6 steps; ids, rail names, frame tags and reveals are fixed; prose is the writer's, following the mockup's text and the spec's tone rules):

| id | rail | frameTag | reveal |
|---|---|---|---|
| problem | The problem | start | points |
| first-guess | First guess | start | points, line |
| measure | Measure | start | points, line, residuals |
| one-step | One step | first-update | points, line, residuals, bowl, path |
| repeat | Repeat | update-8 | points, line, bowl, path |
| result | The result | done | points, line, bowl, path |

`events` must cover `init`, `predict`, `error`, `update`, `overshoot`, `diverged`, `done`; bodies may use `{loss}`, `{iteration}`, `{slope}`. `stats`: `step`, `loss`, `slope`. `lab.presets`: the three preset ids. `lab.params`: `learningRate`, `steps`. `lab.breakIt`: says that above 1.0 every step overshoots more than it fixes, so the loss grows. `lab` also has error strings `tooFew`, `sameX`. `youWillLearn`: 4 items. Article sections (at least): "What is linear regression?", "How the computer finds the line", "The math, step by step" (the loss and both gradients), "When to use it, and when not to" (with a table: situation / works? / why), "Common mistakes". FAQ: at least 4 questions (e.g. why square the errors; what the learning rate does; why scale x; is this machine learning or statistics).

- [ ] **Step 1: Write the failing contract test** (runs over every live lesson so later plans get it for free):

```ts
describe.each(liveLessons().map(l => l.slug))("%s content contract", (slug) => {
  it("story frame tags exist in the default trace", async () => {
    const [c, m] = await Promise.all([loadLesson("en", slug), loadLessonModule(slug)]);
    const t = m.run(m.defaultData, m.defaultParams);
    for (const s of c.story) expect(frameIndexOfTag(t, s.frameTag), s.id).toBeGreaterThanOrEqual(0);
  });
  it("every event in the default and a break-it trace has text", async () => {
    const [c, m] = await Promise.all([loadLesson("en", slug), loadLessonModule(slug)]);
    for (const f of m.run(m.defaultData, m.defaultParams).frames) expect(c.events[f.event], f.event).toBeDefined();
  });
  it("every stat chip and validation error has a label", async () => {
    const [c, m] = await Promise.all([loadLesson("en", slug), loadLessonModule(slug)]);
    const t = m.run(m.defaultData, m.defaultParams);
    for (const s of m.stats(t.frames[0])) expect(c.stats[s.labelKey]).toBeDefined();
  });
});
it("linear regression has texts for overshoot, diverged, tooFew and sameX", async () => {
  const c = await loadLesson("en", "linear-regression");
  expect(Object.keys(c.events)).toEqual(expect.arrayContaining(["overshoot", "diverged"]));
  expect(c.lab.errors).toMatchObject({ tooFew: expect.any(String), sameX: expect.any(String) });
});
```

- [ ] **Step 2: Run** `npx vitest run src/content` → FAIL.
- [ ] **Step 3: Write** `linear-regression.json` and the `lr.*` UI keys.
- [ ] **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `content: linear regression lesson text`.

---

### Task 8: Workspace, Learn mode

**Files:**
- Create: `src/components/workspace/LessonWorkspace.tsx`, `LessonWorkspace.module.css`, `CourseTree.tsx`, `StoryCard.tsx`, `StepRail.tsx`, `StatChips.tsx`, `ModeSwitch.tsx`, `LessonWorkspace.test.tsx`

**Interfaces:**
- Consumes: Tasks 2 to 7.
- Produces: `function LessonWorkspace(props: { slug: string; content: LessonContent }): JSX.Element` (client component).

Behaviour:
- On mount: `loadLessonModule(slug)`, run with defaults, `parseHash(location.hash, story.length)` → initial mode/step. While the module loads, show a skeleton with the same dimensions (no layout shift).
- Learn: grid `222px | 1fr | 300px` (≥ 1000px). Left `CourseTree` (chapters with swatch, chapter `n/m` done counts, lessons; live lessons are links, `soon` lessons are muted with the `lesson.comingSoon` badge and not links; current lesson highlighted green with ink border; progress bar `completedCount / 14`). Centre: eyebrow `<chapter number>. <chapter> / Lesson <n>`, serif title, minutes tag (peach), level tag (green), `ModeSwitch`, `StatChips` for the current frame, the scene with `reveal` from the current story step, `StepRail` (numbered circles; current = green with ink border; clickable). Right `StoryCard` in `aria-live="polite"`: step counter, title, body, Key Idea (lavender box), "Show me the math" `<details>` when `math` exists, Back (disabled on step 1), Next (`story.next` with the next step's rail name; on the last step `story.toLab`, which switches to Lab). Under it, the "You'll learn" checklist ticking item *i* when step ≥ `round(i * (stepsTotal-1) / (items-1))`.
- `ModeSwitch` is two buttons ("Learn", "Lab") with `aria-pressed`.
- Changing story step dispatches `playTo(frameIndexOfTag(trace, step.frameTag))`, writes `history.replaceState` with `formatHash`, and calls `progress.reachStep`; reaching the last step calls `progress.complete`.
- Phone (< 1000px): one column (title, stats, scene, rail, story card); course tree behind a `menu.open` button as a slide-over panel (`inset-inline-start: 0`), closed by `menu.close`, Escape or a link click.

- [ ] **Step 1: Write the failing tests** (render with `UiProvider`, real content, real module; mock `localStorage` with an in-memory Storage):

```ts
it("starts on step 1 and Next walks the story", async () => {
  render(<LessonWorkspace slug="linear-regression" content={lr} />);
  expect(await screen.findByText("Step 1 / 6")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Next: First guess/ }));
  expect(screen.getByText("Step 2 / 6")).toBeVisible();
  expect(location.hash).toBe("#step-2");
});
it("opens at the step in the hash", async () => {
  location.hash = "#step-4";
  render(<LessonWorkspace slug="linear-regression" content={lr} />);
  expect(await screen.findByText("Step 4 / 6")).toBeVisible();
});
it("the last step's button switches to Lab and marks the lesson complete", async () => {
  location.hash = "#step-6";
  render(<LessonWorkspace slug="linear-regression" content={lr} />);
  await user.click(await screen.findByRole("button", { name: /Try it in the lab/ }));
  expect(screen.getByRole("button", { name: "Lab", pressed: true })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("mllab:progress")!)["linear-regression"].completed).toBe(true);
});
it("coming-soon lessons are not links", async () => {
  render(<LessonWorkspace slug="linear-regression" content={lr} />);
  expect(await screen.findByText("Principal Component Analysis")).not.toHaveAttribute("href");  // the ui.json title for pca
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the components and CSS Modules (styles per Global Constraints and the approved mockup `.superpowers/brainstorm/6851-1795639900/content/lesson-layout-v2.html`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: lesson workspace learn mode`.

---

### Task 9: Workspace, Lab mode

**Files:**
- Create: `src/components/workspace/LabPanel.tsx`, `Player.tsx`, `CodePanel.tsx`, `NowCard.tsx`, `LabMode.test.tsx`
- Modify: `LessonWorkspace.tsx`, `LessonWorkspace.module.css`

**Interfaces:**
- Consumes: `usePlayer`, `useLessonKeys`, `LessonModule`, `interpolate`.

Behaviour:
- Lab grid `222px | 1fr | 300px`: left `LabPanel` (`lab.yourData` heading + the module's `LabControls`); centre the scene with `reveal="all"` plus `Player` (first, back, play/pause, next, last; scrubber `input[type=range]` 0..length-1; `n / total` counter; speed chips from `SPEEDS`, 1× default); right `NowCard` (current frame's event title and body interpolated with its metrics, left border blue) and `CodePanel` (Python / Pseudocode tabs; lines whose `key` equals the frame's `codeLine` get the highlight class and `aria-current="true"`; copy button copies the plain text and shows `code.copied` for 2 s).
- Param/data change: `validate(data)`; if it returns a key, show `lab.errors[key]` and keep the previous trace; otherwise re-run and dispatch `load`. Switching mode dispatches `pause`; entering Lab dispatches `load` (index 0). Leaving Lab returns to the last story step.
- `useLessonKeys`: ←/→ = story step in Learn, frame in Lab; Space = play/pause (Lab) or Next (Learn); R = replay current story step (Learn) or `first` + `play` (Lab); L = toggle mode.
- Phone: centre column first, then NowCard, LabPanel, CodePanel stacked.

- [ ] **Step 1: Write the failing tests** (fake timers):

```ts
// openLab(): renders LessonWorkspace with location.hash = "#lab" and waits for the module to load
it("play advances frames and highlights the matching code line", async () => {
  openLab();
  await user.click(screen.getByRole("button", { name: "Play" }));
  vi.advanceTimersByTime(120 * 2);                             // index 0 → 2 (the "error" frame of step 1)
  expect(screen.getByText("3 / 122")).toBeVisible();          // counter shows index + 1
  expect(document.querySelector("[aria-current=true]")!.textContent).toContain("error = guess - y");
});
it("changing the learning rate while playing stops and resets", async () => {
  openLab(); await user.click(screen.getByRole("button", { name: "Play" })); vi.advanceTimersByTime(1200);
  fireEvent.change(screen.getByLabelText(/Learning rate/), { target: { value: "0.5" } });
  vi.advanceTimersByTime(1200);
  expect(screen.getByText(/^1 \/ \d+$/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
});
it("invalid drawn data shows a message and keeps the old trace", async () => {
  openLab(); await user.click(screen.getByRole("button", { name: /Draw your own/ }));   // starts empty
  expect(screen.getByText(lr.lab.errors.tooFew)).toBeVisible();
  expect(screen.getByText(/\/ 122$/)).toBeVisible();
});
it("lr 1.2 shows the overshoot explanation on an overshoot frame", async () => {
  openLab(); fireEvent.change(screen.getByLabelText(/Learning rate/), { target: { value: "1.2" } });
  const t = lrModule.run(lrModule.defaultData, { ...lrModule.defaultParams, learningRate: 1.2 });
  const i = t.frames.findIndex(f => f.event === "overshoot");
  fireEvent.change(screen.getByLabelText("Training step"), { target: { value: String(i) } });
  expect(screen.getByText(lr.events.overshoot.title)).toBeVisible();
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: lesson workspace lab mode with player and code panel`.

---

### Task 10: Lesson route, article, metadata

**Files:**
- Create: `src/app/lessons/[slug]/page.tsx`, `src/components/LessonArticle.tsx`, `LessonArticle.module.css`, `e2e/lesson.spec.ts`

**Interfaces:**
- Consumes: `loadLesson`, `loadUi`, `liveLessons`, `nextLesson`, `LessonWorkspace`.
- Produces: `generateStaticParams()` → live slugs only; `generateMetadata({ params })` → `{ title: "<lesson title> · <site.name>", description: content.description, openGraph: { title, description, type: "article" }, alternates: { canonical: "/lessons/<slug>/" } }`; `dynamicParams = false`.

Page: `<LessonWorkspace>` then `<LessonArticle>` (breadcrumb Home / chapter, serif h1-level heading for the article as `h2`, sections with `Markdownish` and optional table in an `overflow-x: auto` wrapper, FAQ as `<details>`, "Keep learning" card for `nextLesson` (shows "coming soon" if not live), last-updated date from build time). A JSON-LD `LearningResource` script with name, description, `educationalLevel`, `timeRequired` (`PT<minutes>M`).

- [ ] **Step 1: Write the failing e2e test** `e2e/lesson.spec.ts`:

```ts
test("lesson 1: learn to the end, then lab plays", async ({ page }) => {
  const errors: string[] = []; page.on("console", m => m.type() === "error" && errors.push(m.text()));
  await page.goto("/lessons/linear-regression/");
  await expect(page.getByText("Step 1 / 6")).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: /^Next:/ }).click();
  await page.getByRole("button", { name: /Try it in the lab/ }).click();
  await expect(page).toHaveURL(/#lab$/);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByText(/^([2-9]|\d{2,3}) \/ 122$/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("deep link and keyboard", async ({ page }) => {
  await page.goto("/lessons/linear-regression/#step-3");
  await expect(page.getByText("Step 3 / 6")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Step 4 / 6")).toBeVisible();
});
test("article and metadata are in the static HTML", async ({ request }) => {
  const html = await (await request.get("/lessons/linear-regression/")).text();
  expect(html).toContain("<title>Linear Regression · ML Lab</title>");
  expect(html).toContain("What is linear regression?");
  expect(html).toContain("application/ld+json");
});
test("phone: course menu opens and closes", async ({ page }, info) => {
  test.skip(info.project.name !== "phone");
  await page.goto("/lessons/linear-regression/");
  await page.getByRole("button", { name: /course/i }).click();
  await expect(page.getByRole("link", { name: "Linear Regression" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Linear Regression" })).toBeHidden();
});
```

- [ ] **Step 2: Run** `npx next build && npx playwright install chromium && npx playwright test e2e/lesson.spec.ts` → FAIL.
- [ ] **Step 3: Implement** the route and article.
- [ ] **Step 4: Run** the same command → PASS on both projects.
- [ ] **Step 5: Commit** `feat: lesson route with article and metadata`.

---

### Task 11: Home, about, 404, sitemap, budget

**Files:**
- Create: `src/app/page.tsx` (replace scaffold), `src/components/HeroDemo.tsx`, `src/components/ChapterCards.tsx`, `src/app/about/page.tsx`, `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/site.ts`, `scripts/check-budget.mjs`, `e2e/home.spec.ts`

**Interfaces:**
- Produces: `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"` in `src/site.ts` (the real domain is still open with the user); `sitemap()` and `robots()` with `export const dynamic = "force-static"`; sitemap lists `/`, `/about/` and every live lesson.

Home (all text from `ui.json`): eyebrow (`ML LAB · MACHINE LEARNING, STEP BY STEP`), serif hero title "Watch machines *learn*.", subtitle, primary button "Start with linear regression" (ink background) and secondary "All lessons" (scrolls to the list); `HeroDemo` = lesson 1 module with defaults, `reveal` all except `residuals`, looping play at 1×, pausing when off-screen (IntersectionObserver) and showing the final frame still under reduced motion; a 3-step "How it works" strip (Learn → Lab → Break it); `ChapterCards` (6 cards: chapter colour, number, title, one-line blurb from `ui.json`, lesson count, "n live"); full lesson list grouped by chapter (live = link, soon = muted badge); FAQ (4 items); footer (site name, "Free. No sign-up. Runs in your browser.", About link). About page: purpose, how it works, credits. 404: serif "Lost in the loss landscape." with a link home.

`scripts/check-budget.mjs`: reads `out/lessons/linear-regression/index.html`, collects every `<script src>` under `/_next/`, gzips each file from `out/` (node `zlib.gzipSync`), prints the total in KB and exits 1 if > 200 KB.

- [ ] **Step 1: Write the failing e2e test** `e2e/home.spec.ts`:

```ts
test("home lists 14 lessons with 1 live and links into lesson 1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Watch machines");
  await expect(page.locator("[data-lesson-status=live]")).toHaveCount(1);
  await expect(page.locator("[data-lesson-status=soon]")).toHaveCount(13);
  await page.getByRole("link", { name: /Start with linear regression/ }).click();
  await expect(page).toHaveURL(/\/lessons\/linear-regression\/$/);
});
test("reduced motion shows a still demo", async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto("/");
  const a = await page.locator("[data-hero-demo] [data-part=current]").getAttribute("cx");
  await page.waitForTimeout(800);
  expect(await page.locator("[data-hero-demo] [data-part=current]").getAttribute("cx")).toBe(a);
});
test("unknown page shows the 404", async ({ page }) => {
  await page.goto("/nope/");
  await expect(page.getByText("Lost in the loss landscape.")).toBeVisible();
});
test("sitemap lists the live lesson", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/lessons/linear-regression/");
});
```

- [ ] **Step 2: Run** `npx next build && npx playwright test e2e/home.spec.ts` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Full verification.** Run `npx vitest run` → all PASS; `npx next build` → succeeds; `npm run budget` → prints ≤ 200 KB and exits 0; `npx playwright test` → all PASS on desktop and phone; `npx eslint .` → no errors. Open `out/` via `npx serve out -l 3100` and click through home → lesson → lab in both themes at 1440px and 390px.
- [ ] **Step 5: Commit** `feat: home, about, 404, sitemap and JS budget check`.

---

## Later plans (not part of this one)

Each reuses the workspace, engine and content contract unchanged; a lesson = a folder in `src/lessons/`, a content file, a manifest status flip, fixtures from `tools/fixtures/`.

- **Plan 2:** lessons 2 to 5 (Gradient Descent with the plain/Momentum/Adam compare mode, Logistic Regression, KNN, SVM). Adds a small `CompareView` to the workspace.
- **Plan 3:** lessons 6 to 9 (Decision Tree, Random Forest, K-Means, PCA). Adds Canvas region maps where SVG gets slow.
- **Plan 4:** lessons 10 and 11 (Neural Network, Backpropagation). Adds the Web Worker runner (`runInWorker(slug, data, params)`).
- **Plan 5:** lessons 12 to 14 (CNN, RNN, Attention) with pretrained weights from `tools/`.
- **Plan 6:** search (Ctrl K command palette with a build-time index), Open Graph images, deploy to the chosen host and domain, final name.
