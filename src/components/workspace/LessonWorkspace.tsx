"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LessonContent } from "@/content/schema";
import { getChapter, getLesson, lessons, lessonsInChapter } from "@/course/manifest";
import { frameIndexOfTag, type Trace } from "@/engine/types";
import { useT } from "@/i18n/ui-context";
import { loadLessonModule } from "@/lessons/registry";
import type { AnyLessonModule } from "@/lessons/types";
import { BY_HAND_HASH, formatHash, isByHandHash, parseHash, type Mode } from "@/state/hash";
import { useLessonKeys } from "@/state/keys";
import { usePlayer } from "@/state/player";
import { browserStorage, createProgressStore } from "@/state/progress";
import { ModeSwitch, StatChips, StepRail } from "./bits";
import { keepsFrame } from "./keepFrame";
import { ZoomStage } from "./ZoomStage";
import { CourseTree } from "./CourseTree";
import { CodePanel, LabPanel, NowCard } from "./LabParts";
import styles from "./LessonWorkspace.module.css";
import { Player } from "./Player";
import { StoryCard, YouWillLearn } from "./StoryCard";
import { LESSON_TOUR, TOUR_DONE_KEY } from "@/components/tour/steps";
import { Tour } from "@/components/tour/Tour";

function writeHash(h: string) {
  window.history.replaceState(window.history.state, "", h || window.location.pathname + window.location.search);
}

/** The Lab state for a module's paper example ("solve it by hand"), or null when it has none. */
function paperLab(m: AnyLessonModule): LabState | null {
  if (!m.byHand) return null;
  const { data, params } = m.byHand;
  return { params, data, trace: m.run(data, params), runParams: params, error: null };
}

interface LabState {
  params: unknown;
  data: unknown;
  trace: Trace<unknown>;
  /** The params that produced `trace` (differs from `params` while the data is invalid). */
  runParams: unknown;
  error: string | null;
}

/** `tour`: start the guided tour by itself on a first visit (the first lesson sets it). */
export function LessonWorkspace({ slug, content, tour = false }: { slug: string; content: LessonContent; tour?: boolean }) {
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
  const [lab, setLab] = useState<LabState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  /** True while the Lab shows the paper example unchanged. */
  const [onPaper, setOnPaper] = useState(false);
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
    loadLessonModule(slug).then((m) => {
      if (!alive) return;
      setMod(m);
      const paper = isByHandHash(window.location.hash) ? paperLab(m) : null;
      setOnPaper(!!paper);
      setLab(
        paper ?? {
          params: m.defaultParams,
          data: m.defaultData,
          trace: m.run(m.defaultData, m.defaultParams),
          runParams: m.defaultParams,
          error: null,
        },
      );
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const learnTrace = useMemo(() => (mod ? mod.run(mod.defaultData, mod.defaultParams) : null), [mod]);
  const trace = mode === "lab" ? (lab?.trace ?? null) : learnTrace;
  const [player, dispatch] = usePlayer(trace?.frames.length ?? 1);

  const tagIndex = useCallback(
    (i: number) => (learnTrace ? Math.max(0, frameIndexOfTag(learnTrace, story[i].frameTag)) : 0),
    [learnTrace, story],
  );

  // Set when only a view setting changed: the new run keeps the frame the student was on.
  const keepIndexRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const labRef = useRef<LabState | null>(null);
  const onPaperRef = useRef(false);
  useEffect(() => {
    indexRef.current = player.index;
    labRef.current = lab;
    onPaperRef.current = onPaper;
  });

  // A new trace (or mode) resets the player; in Learn it jumps straight to the step's moment.
  useEffect(() => {
    if (!trace) return;
    dispatch({ type: "load", length: trace.frames.length });
    if (mode === "learn") dispatch({ type: "seek", index: tagIndex(step) });
    else if (keepIndexRef.current !== null) dispatch({ type: "seek", index: Math.min(keepIndexRef.current, trace.frames.length - 1) });
    keepIndexRef.current = null;
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

  /** Re-run on new data or params; invalid data shows a message and keeps the previous run. */
  const updateLab = useCallback(
    (patch: { params?: unknown; data?: unknown }) => {
      if (!mod) return;
      // Any edit stops playback, even when the data is invalid and the old run stays on screen.
      dispatch({ type: "pause" });
      if (onPaperRef.current) {
        setOnPaper(false);
        writeHash(formatHash("lab", 0));
      }
      const prev = labRef.current;
      keepIndexRef.current = keepsFrame(mod, prev, patch) ? indexRef.current : null;
      setLab((prev) => {
        if (!prev) return prev;
        const params = patch.params ?? prev.params;
        const data = patch.data ?? prev.data;
        const error = mod.validate(data);
        return error
          ? { ...prev, params, data, error }
          : { params, data, error: null, trace: mod.run(data, params), runParams: params };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mod],
  );

  // Keyboard shortcuts only apply while the workspace is on screen.
  const rootRef = useRef<HTMLDivElement>(null);

  /** Shows the paper example in the Lab ("solve it by hand" → "Try this example in the Lab"). */
  const openPaper = useCallback(() => {
    const paper = mod ? paperLab(mod) : null;
    if (!paper) return;
    dispatch({ type: "pause" });
    keepIndexRef.current = null;
    setLab(paper);
    setOnPaper(true);
    setMode("lab");
    writeHash(BY_HAND_HASH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod]);

  // The paper example's link sets #lab-by-hand while the page is open: switch and bring the Lab into view.
  useEffect(() => {
    const onHash = () => {
      if (!isByHandHash(window.location.hash)) return;
      openPaper();
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      rootRef.current?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [openPaper]);
  const inView = useRef(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLessonKeys({
    next: () => (mode === "learn" ? goStep(step + 1) : dispatch({ type: "next" })),
    prev: () => (mode === "learn" ? goStep(step - 1) : dispatch({ type: "prev" })),
    togglePlay: () => {
      if (mode === "lab") dispatch({ type: "toggle" });
      else if (step < last) goStep(step + 1);
      else switchMode("lab");
    },
    replay: () => {
      if (mode === "lab") {
        dispatch({ type: "first" });
        dispatch({ type: "play" });
      } else {
        dispatch({ type: "seek", index: step > 0 ? tagIndex(step - 1) : 0 });
        dispatch({ type: "playTo", index: tagIndex(step) });
      }
    },
    toggleMode: () => switchMode(mode === "learn" ? "lab" : "learn"),
  }, () => inView.current);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const reveal = useMemo(() => (mode === "lab" ? ("all" as const) : new Set(story[step].reveal)), [mode, story, step]);
  const index = trace ? Math.min(player.index, trace.frames.length - 1) : 0;
  const frame = trace?.frames[index];
  const sceneData = mode === "lab" ? lab?.data : mod?.defaultData;
  const params = mode === "lab" ? lab?.runParams : mod?.defaultParams;

  // Guided tour: starts by itself once for a new visitor (never over a shared #step/#lab link).
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (!tour || window.location.hash) return;
    let done = false;
    try {
      done = localStorage.getItem(TOUR_DONE_KEY) === "1";
    } catch {
      done = false;
    }
    if (done) return;
    const id = window.setTimeout(() => setTourOpen(true), 300);
    return () => window.clearTimeout(id);
  }, [tour]);
  // The Lab's Paper example button exists only where the Lab can show the paper example.
  const tourSteps = useMemo(() => LESSON_TOUR.filter((s) => s.id !== "paper" || !!mod?.byHand), [mod]);
  const closeTour = (finished: boolean) => {
    setTourOpen(false);
    try {
      localStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {
      /* the tour may show again next time */
    }
    if (finished) {
      switchMode("learn");
      goStep(0);
    }
  };

  return (
    <div ref={rootRef} className={styles.workspace} data-mode={mode}>
      {tourOpen && <Tour steps={tourSteps} onClose={closeTour} onEnterStep={(s) => s.mode && switchMode(s.mode)} />}
      <aside className={`${styles.tree} ${menuOpen ? styles.open : ""}`} aria-label={t("course.heading")}>
        <button type="button" className={`${styles.closeMenu} btn`} onClick={() => setMenuOpen(false)}>
          {t("menu.close")}
        </button>
        <div className={styles.card}>
          <CourseTree currentSlug={slug} completed={completed} onNavigate={() => setMenuOpen(false)} />
        </div>
      </aside>
      {menuOpen && <div className={styles.scrim} onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {mode === "lab" && mod && lab && (
        <aside className={styles.labSide}>
          <LabPanel lab={content.lab} error={lab.error} paper={mod.byHand ? { on: onPaper, open: openPaper } : undefined}>
            <mod.LabControls
              params={lab.params}
              data={lab.data}
              onParams={(p: unknown) => updateLab({ params: p })}
              onData={(d: unknown) => updateLab({ data: d })}
              labels={content.lab}
            />
          </LabPanel>
        </aside>
      )}

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
          <button type="button" className={styles.help} onClick={() => setTourOpen(true)} aria-label={t("tour.start")} title={t("tour.start")}>
            ?
          </button>
          <div className={styles.modeSlot}>
            <ModeSwitch mode={mode} onMode={switchMode} />
          </div>
        </div>

        <ZoomStage
          className={styles.stage}
          enabled={mode === "lab" && !!(mod && trace && frame)}
          header={mod && trace && frame ? <StatChips chips={mod.stats(frame, params)} labels={content.stats} /> : null}
        >
          {mod && trace && frame ? (
            <>
              <mod.Scene
                trace={trace}
                index={index}
                data={sceneData}
                reveal={reveal}
                onData={mode === "lab" ? (d: unknown) => updateLab({ data: d }) : undefined}
                stale={mode === "lab" && !!lab?.error}
              />
            </>
          ) : (
            <div className={styles.skeleton} role="status">
              {t("lesson.loading")}
            </div>
          )}
        </ZoomStage>

        {mode === "learn" ? (
          <StepRail rails={story.map((s) => s.rail)} step={step} onStep={goStep} />
        ) : (
          trace && <Player state={player} dispatch={dispatch} />
        )}
      </section>

      <aside className={styles.right}>
        {mode === "learn" ? (
          <div className={styles.card} data-tour="story">
            <StoryCard
              step={story[step]}
              index={step}
              total={story.length}
              nextRail={step < last ? story[step + 1].rail : undefined}
              onBack={() => goStep(step - 1)}
              onNext={() => (step < last ? goStep(step + 1) : switchMode("lab"))}
            />
            <YouWillLearn items={content.youWillLearn} step={step} total={story.length} />
          </div>
        ) : (
          mod &&
          frame && (
            <>
              <div className={styles.now}>
                <NowCard frame={frame} events={content.events} playing={player.playing} />
              </div>
              <div className={styles.codeSlot} data-tour="code">
                <CodePanel code={mod.code} active={frame.codeLine} />
              </div>
            </>
          )
        )}
      </aside>
    </div>
  );
}
