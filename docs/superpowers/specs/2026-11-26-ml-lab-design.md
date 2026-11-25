# ML Lab: design

Date: 2026-11-26 · Status: approved 2026-11-26 · Working name "ML Lab" (placeholder)

## 1. Intent

A free website that helps students understand machine learning and deep learning by watching
algorithms work, step by step, and then experimenting with them. Anyone can open it: no
account, no payment, no install.

It combines two existing sites:

- **designedtoscale.app** (a guided course): a chapter tree, a central animated scene, a narrated
  story with Back/Next, a step rail and progress tracking.
- **algolab.rajpurohit.me** (a workbench): your own input, a play/scrub player, the current code line
  highlighted, compare modes and a long explanatory article under each tool.

Every lesson has both: **Learn** (the guided story) and **Lab** (the playground) on the same page.

We copy the *feel* (warm paper palette, monospace UI, serif display headings, hand-drawn-but-precise
diagrams), not the assets. All names, text, illustrations and code are original.

## 2. Goals, non-goals, anti-goals

**Goals**
- A student with school algebra and no ML background can finish lesson 1 and explain what
  "training" means.
- Every one of the 14 lessons shows the real algorithm running on real numbers, not a canned video.
- Every lesson has a "break it" moment: one control that makes the algorithm fail visibly, with an
  explanation of why (e.g. too large a learning rate overshoots the bowl).
- Each lesson is its own fast, search-indexable page.
- Works on phones and on slow laptops.
- Structure scales from 14 to ~40 lessons, and from English to more languages, without a rewrite.

**Non-goals (v1)**
- Accounts, sign-in, cloud sync, payments.
- Languages other than English (the plumbing for them is in place, see §7).
- C++/Java/JS code tabs (Python + pseudocode only).
- AI chat assistant, quizzes/exams, certificates, comments, forum.
- Analytics or tracking.
- Training on large datasets or GPUs.

**Anti-goals (a failure even if it "works")**
- A beginner meets a formula or jargon before the plain-words idea.
- The animation is fake: what the student sees does not come from the code shown.
- A lesson page is heavy or janky on a mid-range phone.
- Visual clutter: Learn mode must feel calm, one idea per step.
- Looks like a clone of either reference site (same name, logo, illustrations or text).

## 3. Constraints

- Free to run at any number of students → fully static site; all computation in the browser.
- No server, no database. Progress is stored in `localStorage`.
- Hosting: any static host (Vercel is already connected; GitHub Pages and Cloudflare Pages also work).
- Accessibility: keyboard-operable, readable contrast in light and dark, respects reduced motion.

## 4. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| **Next.js (App Router, static export)** | Every lesson prerendered as its own page (search engines); largest ecosystem; mature i18n; one React model for the heavily interactive lesson page | **Chosen** |
| Astro + React islands | Best for text-heavy pages, but our lesson pages are almost entirely interactive, so its main advantage barely applies | Rejected |
| Vite React single-page app | Simplest, but lessons are not individually indexable, which works against "everyone can reach it" | Rejected |

ML engine: **hand-written TypeScript math** instead of TensorFlow.js. Every intermediate step must
be recorded so students can scrub through it and see which code line ran; TF.js hides those steps
and is heavy on slow devices. Lesson-sized models are small enough to write and test by hand.

## 5. Decisions made with the user

- Audience: students; free; open to everyone.
- Scope v1: **14 lessons in 6 chapters** (option B). Later lessons can be listed as "coming soon";
  target is ~40 lessons later (option C).
- Lesson layout: **A, a Learn/Lab switch on one page** (see mockup in §8).
- Language: English now, all text in separate files so languages can be added later.
- Stack: Next.js + hand-written TS math (as recommended).
- Look: similar to the two reference sites (warm paper, mono UI, serif headlines).

## 6. Curriculum (v1)

Each lesson: Learn story of 6 to 10 steps; Lab with data presets, "draw your own" data where it makes
sense, the main hyperparameters, and a player. "Break it" is the failure moment.

| # | Chapter | Lesson | Scene | Lab controls | Break it |
|---|---|---|---|---|---|
| 1 | 01 Foundations | Linear Regression | Scatter + fitted line + residual sticks; 3D loss bowl with descent path | Data presets, draw points, learning rate | Learning rate too high diverges; one outlier drags the line |
| 2 | 01 Foundations | Gradient Descent | Contour/3D surface with ball path | Surface choice (bowl, ravine, saddle, two valleys), start point, lr | Ravine zig-zag; stuck in local minimum. Compare: plain vs Momentum vs Adam (the only v1 compare mode) |
| 3 | 02 Classification | Logistic Regression | 2D points, decision boundary, sigmoid curve inset | Presets, draw two classes, lr, threshold | Data that is not linearly separable (circles) |
| 4 | 02 Classification | k-Nearest Neighbors | Query point, distance circles, k nearest highlighted, region map | k, distance metric, click to place query | k=1 overfits noise; k=n predicts majority everywhere |
| 5 | 02 Classification | Support Vector Machine | Margin, support vectors, boundary; kernel view | C, kernel (linear/RBF), gamma | Tiny C vs huge C; RBF gamma too high |
| 6 | 03 Trees & Forests | Decision Tree | Splits drawn on the plane + tree growing beside it; Gini per candidate split | Max depth, min samples | Unlimited depth memorizes noise |
| 7 | 03 Trees & Forests | Random Forest | Several small trees on bootstrap samples, votes combined into the region map | Number of trees, max depth, feature sampling | 1 tree vs 50 trees on noisy data |
| 8 | 04 Finding Patterns | K-Means | Points, centroids moving, assignment then update phases | k, init (random/k-means++), presets | Bad init; wrong k; non-round clusters |
| 9 | 04 Finding Patterns | PCA | 2D cloud rotating to principal axes; projection onto 1D; variance bars | Presets, number of components | Data where variance ≠ what matters (two parallel stripes) |
| 10 | 05 Neural Networks | Neural Network | Neuron → layer → network diagram; activations as colored nodes; decision region | Layers/neurons, activation, dataset | Too few neurons cannot draw a curved boundary |
| 11 | 05 Neural Networks | Backpropagation | Same network; forward pass flows right, gradients flow left with values on edges | lr, step forward/backward per layer | Sigmoid deep stack: vanishing gradients |
| 12 | 06 Deep Learning | Convolutional Neural Network | 8×8 digit image, kernel sliding, feature maps, pooling, prediction bars | Draw a digit, choose kernel, step through convolution | Shifted or noisy digit; edge detector vs blur kernel |
| 13 | 06 Deep Learning | Recurrent Neural Network | Unrolled cells over a character sequence; hidden state as a color strip | Input text, sequence length | Long sequence: early info fades |
| 14 | 06 Deep Learning | Attention & Transformers | Tokens; Query/Key/Value vectors; attention matrix heat-map; output mix | Edit the sentence, pick a token to inspect, heads | Remove position information: word order stops mattering |

Lessons 1 and 2 overlap on purpose: lesson 1 is about the *model and the loss* and shows descent
only as "roll downhill"; lesson 2 is about the *optimizer* itself (step size, momentum, Adam,
surfaces where descent struggles). *(My call.)*

Data notes: lessons use tiny built-in datasets (≤ a few hundred points). Lesson 12 uses an 8×8 digits
dataset with a permissive licence (e.g. the UCI optical digits set, as shipped with scikit-learn).
Lessons 12 to 14 may ship **small pretrained weights** produced by Python scripts in `tools/` (committed,
reproducible) so the scene is meaningful immediately; the Lab still recomputes everything live from
those weights and the student's input. Lessons 1 to 11 train live in the browser.

## 7. How it works

### 7.1 Pages and routes

- `/`: home. Hero ("Watch machines *learn*." with a live mini-animation), tour of the
  Learn/Lab idea, chapter cards, full lesson list (14 live + "coming soon" slots), FAQ, footer.
- `/lessons/<slug>`: lesson page. Learn by default; Lab via the switch. Mode and step live in the
  URL hash (`#lab`, `#step-4`) so links are shareable and the page stays a single static file.
  Below the workspace: an explanatory article (what it is, when to use it, math in full,
  complexity/trade-offs table, FAQ, "keep learning" links), written for students and for search.
- `/about`, a `404` page.
- English URLs have no locale prefix and must never change. Future languages get a prefix
  (`/ar/lessons/...`). *(My call.)*

### 7.2 Lesson page (layout A)

- **Top bar:** logo, search (Ctrl K), theme toggle. The language switcher stays hidden until there are 2+ locales.
- **Learn mode:** left = course tree (chapters with color swatch, lessons, progress bar);
  centre = title, tags (time, level), Learn/Lab switch, stat chips (e.g. STEP / LOSS / w), scene,
  step rail; right = story card (step N of M, title, text, Key Idea box, "Show me the math"
  collapsible, Back / Next: <next step name>; the last step's button opens the Lab).
  Below the story card: "You'll learn" checklist, ticked as steps are reached.
- **Lab mode:** left = Your data (presets, draw your own) + parameters + break-it hint;
  centre = same scene + player (first/back/play/next/last, scrubber, speed 0.25× to 4×, step counter);
  right = Current step explanation + Code (Python / Pseudocode tabs, active line highlighted, copy button).
- **Keyboard:** ←/→ step, Space play/pause, R replay, L toggle Learn/Lab.
- **Phone (< 1000px):** single column: scene, then story card (Learn) or player then controls
  (Lab); course tree in a slide-over menu. *(My call.)*
- Visiting a lesson's last Learn step marks it complete.

### 7.3 Engine: traces

The core rule: **the animation is a replay of a recorded run.**

```
run(algorithm, data, params) → Trace
Trace  = { frames: Frame[], meta }
Frame  = { state, codeLine, event, metrics, tags }
```

- Each algorithm is a pure TypeScript function that emits a frame at every meaningful moment
  (assign point, move centroid, forward through layer, gradient update...). `codeLine` maps to the
  pseudocode/Python line shown; `event` is a key into the lesson's text file for the explanation.
- **Granularity:** long trainings record at a chosen level (per sample / per batch / per epoch) and
  are capped (≈2,000 frames) by keeping evenly spaced frames plus every event-tagged frame.
- The **scene** is a React component that renders one `Frame` as SVG (Canvas only where SVG is too
  slow, e.g. region maps with many cells). It has no logic of its own.
- **Learn** story steps reference frames by tag (e.g. `step 4 → tag "first-update"`) and play to them.
- **Lab** re-runs the algorithm when data/params change, then plays the new trace.
- Heavy runs (CNN, RNN, larger nets) execute in a Web Worker so the UI never freezes.
- Deterministic: seeded random numbers, so a shared link reproduces the same run.

### 7.4 Content and languages

- Lesson text lives in `content/en/lessons/<slug>.json` (story steps, key ideas, math, event
  explanations, lab hints, article sections, FAQ), with a small Markdown subset for bold/italic/code.
  All UI strings are in `content/en/ui.json`. Schemas validated at build time (zod). *(My call.)*
- Lesson logic lives in `src/lessons/<slug>/` (algorithm, scene, presets, story-step → frame tags).
- Adding a language = copying `content/en` to `content/<locale>` and translating; adding a lesson =
  a new folder + a new content file + one line in the course manifest.
- A future right-to-left language must be possible: use CSS logical properties (`margin-inline-start`, etc.)
  from day one. *(My call; costs almost nothing now.)*

### 7.5 Search

A client-side index (lesson titles, key ideas, glossary terms from articles) built at build time;
Ctrl K opens a command palette. *(My call.)*

### 7.6 Progress

`localStorage`: completed lessons, last step reached per lesson, last mode, theme. Wrapped in
try/catch; the site works fully without it.

## 8. Visual design

Reference mockup (approved layout A): `.superpowers/brainstorm/6851-1795639900/content/lesson-layout-v2.html`.

- **Palette (light):** background `#f1e9dd`, panel `#f9f3ea`, card `#fdf9f2`, ink `#1d1b18`,
  secondary ink `#4a453e`, muted `#7a7268`, lines `#dccfbe` / `#c4b7a5`.
  Accents: green `#cfe3b2` (active/primary), peach `#fbdcbc` (data, tags), lavender `#e3dbf0`
  (Key Idea), blue `#2c62d6` (the model's prediction / current line), red `#c0392b` (error/residual).
  Chapter swatches: amber, green, purple, orange, blue, rose.
- **Dark theme:** same roles on a warm near-black; respects system setting, toggle overrides.
- **Type:** UI and code in JetBrains Mono; page and lesson titles in Instrument Serif (with italic
  for emphasis); body text in the system sans stack. Fonts self-hosted.
- **Components:** chunky buttons with a 1.5px ink border and a 2px offset shadow that presses down;
  pill tags; dotted-grid scene background; numbered step rail.
- **Scene style:** precise SVG diagrams; peach data points with ink outlines; isometric 3D for loss
  surfaces (as in the mockup).
- **Motion:** easing between frames; `prefers-reduced-motion` = no tweening, instant frame changes.

## 9. Quality

- **Algorithm correctness:** unit tests (Vitest) for every algorithm against known results
  (fixtures computed once with NumPy/scikit-learn scripts in `tools/` and committed).
- **Trace contract tests:** every story step's tag exists in the default trace; every frame's
  `codeLine` exists in both code tabs; every `event` has text in `en`.
- **End-to-end smoke (Playwright):** each lesson loads, Learn steps forward to the end, Lab plays,
  no console errors; one run at phone width.
- **Performance budget:** lesson page ≤ ~200 KB JS gzipped excluding pretrained weights;
  Lighthouse performance ≥ 90 on mobile for lesson 1.
- **Accessibility:** keyboard reachable everything; the step text is in an `aria-live` region; colours
  are never the only signal (shapes/labels too); contrast AA in both themes.

## 10. Build order (suggested)

1. Project skeleton, design tokens, fonts, theme, top bar, home page shell, course manifest.
2. Lesson page frame (layout A, both modes, player, story card, code panel, keyboard, phone layout)
   driven by the trace engine.
3. Lesson 1 end to end (it is the template every later lesson copies), with its article.
4. Lessons 2 to 11 (live-trained), then 12 to 14 (Workers + pretrained weights).
5. Search, about, 404, SEO metadata (titles, descriptions, Open Graph images, sitemap), deploy.

## 11. Left to the builder

- Exact Next.js and library versions (current stable at build time), state management, animation helper.
- Exact story text and articles, within the tone rules: plain words first, one idea per step,
  math optional, school-algebra level.
- Dark palette values, icons, the home-page mini-animation, Open Graph image design.
- Dataset presets per lesson beyond those listed.

## 12. Open with the user

- Final site name (placeholder "ML Lab") and domain.
