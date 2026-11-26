# ML Lab: Arabic and Turkish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Serve the whole site in Arabic (right-to-left) and Turkish next to English, without changing any English URL.

**Architecture:**
- **Routes:** English pages live in `app/(en)` at their old URLs. Arabic and Turkish pages live in `app/[locale]` under `/ar/…` and `/tr/…`, statically generated.
- **Shared views:** pages are views that take a locale (`src/views`). One root layout. A post-build step stamps `<html lang dir>` per language.
- **Content:** files live in `content/<locale>/`. A lesson not yet translated falls back to English with a notice.

**Spec:** `docs/superpowers/specs/2026-11-26-ml-lab-design.md` (§7.4 i18n: text in separate files, CSS logical properties, switcher hidden until 2+ locales).

## Global Constraints
- English URLs unchanged; `hreflang` alternates on every page and in the sitemap.
- Charts, code and maths stay left-to-right inside Arabic pages; Arabic uses Western digits.
- The models' own vocabulary stays English: the attention lesson's 16 words and the RNN letters a–h.
- Translations keep every placeholder, bold pair, maths string and every number the English states (`src/content/translations.test.ts`).
- Branch per step, merged `--no-ff` and pushed; no Claude trailers.

### Task 1: Infrastructure + interface strings (branch `feature/i18n`)
### Task 2: Lessons 1–7 in Arabic and Turkish (branch `i18n/lessons-1`)
### Task 3: Lessons 8–14 in Arabic and Turkish (branch `i18n/lessons-2`)
### Task 4: Remove the fallback requirement (every live lesson translated), README, screenshots
