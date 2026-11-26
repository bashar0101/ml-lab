# ML Lab: Search and Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn on the Ctrl K search palette (spec §7.5) and give every page an Open Graph image (spec §10 step 5). Deploying waits for the user's choice of host, name and domain.

**Architecture:** A pure `buildSearchIndex` turns lesson content into entries. A `force-static` route handler writes them to `/search-index.json` at build time. A client `SearchPalette` replaces the disabled top-bar button, fetches the index the first time it opens, and ranks results with a pure `searchEntries`. OG images are build-time `opengraph-image.tsx` files (Next `ImageResponse`), one site-wide and one per lesson.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-26-ml-lab-design.md` (§7.5 Search, §10 step 5, §8 visual design).

## Global Constraints

- Static export only: no server; route handlers need `export const dynamic = "force-static"`.
- No new runtime dependencies.
- All visible text in `content/en/ui.json`.
- Every lesson page stays ≤ 200 KB gzipped JS (`npm run budget`).
- Keyboard: Ctrl K / ⌘ K opens and closes the palette, "/" opens it when not typing, ↑/↓ move, Enter opens, Esc closes and returns focus.
- Branch per task, merged `--no-ff` into `main` and pushed. No Claude trailers.

## Review Focus

1. The index includes only live lessons; links use the `#step-N` hash format that `src/state/hash.ts` reads.
2. Ranking: a lesson-title match beats a body match ("attention" finds the Attention lesson first).
3. Markdown in story bodies (`**`, `*`, backticks) is stripped from the index text.
4. Lesson keyboard shortcuts must not fire while typing in the palette.
5. OG images render for every lesson slug at build time.

---

### Task 1: Search (branch `feature/search`)

**Files:** create `src/search/index.ts` (+ test), `src/app/search-index.json/route.ts`, `src/components/SearchPalette.tsx` (+ test, CSS module). Modify `src/components/TopBar.tsx`, `src/app/layout.tsx`, `content/en/ui.json`, and add an e2e test.

**Interfaces:**
- `interface SearchEntry { href: string; title: string; lesson: string; kind: "lesson" | "step" | "topic" | "faq"; text: string }`
- `buildSearchIndex(items: { slug: string; content: LessonContent }[]): SearchEntry[]`
  - one `lesson` entry (description + "you will learn")
  - one `step` entry per story step, linking to `#step-N`
  - one `topic` entry per article section
  - one `faq` entry per FAQ question
- `searchEntries(entries: SearchEntry[], query: string, limit = 8): SearchEntry[]`
  - every query word must match somewhere
  - score: title > lesson name > text, plus a boost for `lesson` entries
  - stable order on ties

**Tests:**
- Index: counts per lesson, hrefs, and markdown stripped.
- Ranking: "attention" → the Attention lesson first; "soft max" → softmax steps; "zzz" → [].
- Palette (open via Ctrl K and "/"):
  - fetches once
  - arrow keys plus Enter navigate
  - Esc closes and restores focus
  - the empty-results message shows
- e2e: open with Ctrl K, type "backprop", press Enter, and land on `/lessons/backpropagation/`.

### Task 2: Open Graph images (branch `feature/og-images`)

**Files:** create `src/app/opengraph-image.tsx` and `src/app/lessons/[slug]/opengraph-image.tsx`, plus a test that the build output contains one image per live lesson. Images are 1200×630, in the site palette, showing the lesson's title, chapter and description (fonts as available to `ImageResponse`).

### Task 3: Deploy

Ask the user for the host, final name and domain. Nothing gets published without an explicit yes.
