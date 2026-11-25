"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LessonContent } from "@/content/schema";
import { getChapter, getLesson, lessons, lessonsInChapter } from "@/course/manifest";
import { frameIndexOfTag } from "@/engine/types";
import { useT } from "@/i18n/ui-context";
import { loadLessonModule } from "@/lessons/registry";
import type { AnyLessonModule } from "@/lessons/types";
import { formatHash, parseHash, type Mode } from "@/state/hash";
import { usePlayer } from "@/state/player";
import { browserStorage, createProgressStore } from "@/state/progress";
import { ModeSwitch, StatChips, StepRail } from "./bits";
import { CourseTree } from "./CourseTree";
import styles from "./LessonWorkspace.module.css";
import { StoryCard, YouWillLearn } from "./StoryCard";

function writeHash(h: string) {
  window.history.replaceState(window.history.state, "", h || window.location.pathname + window.location.search);
}

export function LessonWorkspace({ slug, content }: { slug: string; content: LessonContent }) {
  const t = useT();
  const entry = getLesson(slug);
  if (!entry) throw new Error(`Unknown lesson: ${slug}`);
  const chapter = getChapter(entry.chapter);
  const numberInChapter = lessonsInChapter(entry.chapter).findIndex((l) => l.slug === slug) + 1;
  const story = content.story;
  const last = story.length - 1;

  const [mod, setMod] = useState<AnyLessonModule | null>(null);
  const [mode, setMode] = useState<Mode>("learn");
  const [step, setStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => new Set());
  const progress = useMemo(() => createProgressStore(typeof window === "undefined" ? null : browserStorage()), []);

  const refreshCompleted = useCallback(() => {
    setCompleted(new Set(lessons.filter((l) => progress.get(l.slug).completed).map((l) => l.slug)));
  }, [progress]);

  const recordStep = useCallback(
    (i: number) => {
      progress.reachStep(slug, i);
      if (i === last) progress.complete(slug);
      refreshCompleted();
    },
    [progress, slug, last, refreshCompleted],
  );

  // Initial mode/step from the URL, then load the lesson's code.
  useEffect(() => {
    const h = parseHash(window.location.hash, story.length);
    // The URL hash only exists in the browser: sync it once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(h.mode);
    setStep(h.step);
    if (h.mode === "learn") recordStep(h.step);
    else refreshCompleted();
    let alive = true;
    loadLessonModule(slug).then((m) => alive && setMod(m));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const learnTrace = useMemo(() => (mod ? mod.run(mod.defaultData, mod.defaultParams) : null), [mod]);
  const trace = learnTrace;
  const [player, dispatch] = usePlayer(trace?.frames.length ?? 1);

  const tagIndex = useCallback(
    (i: number) => (learnTrace ? Math.max(0, frameIndexOfTag(learnTrace, story[i].frameTag)) : 0),
    [learnTrace, story],
  );

  // A new trace (or mode) resets the player; in Learn it jumps straight to the step's moment.
  useEffect(() => {
    if (!trace) return;
    dispatch({ type: "load", length: trace.frames.length });
    if (mode === "learn") dispatch({ type: "seek", index: tagIndex(step) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, mode]);

  const goStep = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(last, i));
      setStep(next);
      dispatch({ type: "playTo", index: tagIndex(next) });
      writeHash(formatHash("learn", next));
      recordStep(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [last, tagIndex, recordStep],
  );

  const switchMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      dispatch({ type: "pause" });
      setMode(m);
      writeHash(formatHash(m, step));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, step],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const reveal = useMemo(() => (mode === "lab" ? ("all" as const) : new Set(story[step].reveal)), [mode, story, step]);
  const index = trace ? Math.min(player.index, trace.frames.length - 1) : 0;
  const frame = trace?.frames[index];

  return (
    <div className={styles.workspace} data-mode={mode}>
      <aside className={`${styles.left} ${menuOpen ? styles.open : ""}`} aria-label={t("course.heading")}>
        <button type="button" className={`${styles.closeMenu} btn`} onClick={() => setMenuOpen(false)}>
          {t("menu.close")}
        </button>
        <div className={styles.card}>
          <CourseTree currentSlug={slug} completed={completed} onNavigate={() => setMenuOpen(false)} />
        </div>
      </aside>
      {menuOpen && <div className={styles.scrim} onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <section className={`${styles.card} ${styles.center}`}>
        <div className={styles.head}>
          <button
            type="button"
            className={`${styles.menuButton} btn`}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
          >
            ☰ <span>{t("menu.open")}</span>
          </button>
          <div className={styles.titles}>
            <div className={styles.eyebrow}>
              {t("lesson.eyebrow", { number: chapter.number, chapter: t(`chapter.${chapter.id}`), n: numberInChapter })}
            </div>
            <h1 className={styles.h1}>{content.title}</h1>
          </div>
          <span className={styles.tag} data-tone="peach">
            {t("lesson.minutes", { n: entry.minutes })}
          </span>
          <span className={styles.tag} data-tone="green">
            {t(`level.${entry.level}`)}
          </span>
          <div className={styles.modeSlot}>
            <ModeSwitch mode={mode} onMode={switchMode} />
          </div>
        </div>

        <div className={styles.stage}>
          {mod && trace && frame ? (
            <>
              <StatChips chips={mod.stats(frame, mod.defaultParams)} labels={content.stats} />
              <mod.Scene trace={trace} index={index} data={mod.defaultData} reveal={reveal} />
            </>
          ) : (
            <div className={styles.skeleton} role="status">
              {t("lesson.loading")}
            </div>
          )}
        </div>

        {mode === "learn" && <StepRail rails={story.map((s) => s.rail)} step={step} onStep={goStep} />}
      </section>

      <aside className={`${styles.card} ${styles.right}`}>
        {mode === "learn" && (
          <>
            <StoryCard
              step={story[step]}
              index={step}
              total={story.length}
              nextRail={step < last ? story[step + 1].rail : undefined}
              onBack={() => goStep(step - 1)}
              onNext={() => (step < last ? goStep(step + 1) : switchMode("lab"))}
            />
            <YouWillLearn items={content.youWillLearn} step={step} total={story.length} />
          </>
        )}
      </aside>
    </div>
  );
}
