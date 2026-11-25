"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadLessonModule } from "@/lessons/registry";
import type { AnyLessonModule } from "@/lessons/types";
import styles from "./home.module.css";

const REVEAL = new Set(["points", "line", "bowl", "path"]);
const TICK_MS = 90;
const HOLD_TICKS = 25; // pause on the final frame before looping

/** Lesson 1 on a loop: a live preview of what every lesson does. */
export function HeroDemo() {
  const [mod, setMod] = useState<AnyLessonModule | null>(null);
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadLessonModule("linear-regression").then((m) => alive && setMod(m));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      alive = false;
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const trace = useMemo(() => (mod ? mod.run(mod.defaultData, mod.defaultParams) : null), [mod]);
  // Only the moments where the line moves: start + each update.
  const frames = useMemo(
    () => (trace ? trace.frames.map((f, i) => ({ f, i })).filter(({ f }) => f.codeLine === "init" || f.codeLine === "update" || f.codeLine === "return") : []),
    [trace],
  );

  useEffect(() => {
    if (!frames.length || still || !visible) return;
    const id = setInterval(() => setTick((t) => (t + 1) % (frames.length + HOLD_TICKS)), TICK_MS);
    return () => clearInterval(id);
  }, [frames.length, still, visible]);

  const shown = still ? frames.length - 1 : Math.min(tick, frames.length - 1);
  return (
    <div ref={ref} className={styles.demo} data-hero-demo>
      {mod && trace && frames.length > 0 ? (
        <mod.Scene trace={trace} index={frames[shown].i} data={mod.defaultData} reveal={REVEAL} />
      ) : (
        <div className={styles.demoSkeleton} />
      )}
    </div>
  );
}
