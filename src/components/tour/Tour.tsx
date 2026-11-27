"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/ui-context";
import type { TourStep } from "./steps";
import styles from "./Tour.module.css";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const GAP = 12;

/** The first visible element marked data-tour="<target>" (some parts exist twice across layouts). */
function findTarget(target: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  return all.find((el) => el.getClientRects().length > 0) ?? all[0] ?? null;
}

/**
 * A spotlight tour: the page dims, one part at a time is lit, and a small card explains it.
 * `onEnterStep` lets the page get ready first (e.g. open the Lab); Escape skips, arrow keys move.
 */
export function Tour({
  steps,
  onClose,
  onEnterStep,
}: {
  steps: TourStep[];
  onClose(finished: boolean): void;
  onEnterStep?(step: TourStep): void;
}) {
  const t = useT();
  const id = useId();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [card, setCard] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i))), [steps.length]);

  // Let the page get ready for this stop (switch Learn/Lab) before it is lit.
  const enter = useRef(onEnterStep);
  useLayoutEffect(() => {
    enter.current = onEnterStep;
  });
  useLayoutEffect(() => {
    enter.current?.(step);
  }, [step]);

  // Find, scroll to and light the target; follow it on scroll and resize.
  useEffect(() => {
    let raf = 0;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const el = findTarget(step.target);
      const r = el?.getBoundingClientRect();
      setBox(r && r.width > 0 ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 } : null);
    };
    // Two frames: the mode switch renders first, then the element is in place.
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        findTarget(step.target)?.scrollIntoView?.({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
        measure();
      });
    });
    const settle = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  // The card goes below the lit part, else above, else centred (phones: a bottom sheet, in CSS).
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth || 320;
    const h = el.offsetHeight || 180;
    let next: { top: number; left: number };
    if (!box) next = { top: Math.max(GAP, (vh - h) / 2), left: Math.max(GAP, (vw - w) / 2) };
    else {
      const left = Math.min(Math.max(GAP, box.left + box.width / 2 - w / 2), Math.max(GAP, vw - w - GAP));
      if (box.top + box.height + GAP + h <= vh) next = { top: box.top + box.height + GAP, left };
      else if (box.top - GAP - h >= 0) next = { top: box.top - GAP - h, left };
      else next = { top: Math.max(GAP, vh - h - GAP), left };
    }
    setCard((prev) => (prev && prev.top === next.top && prev.left === next.left ? prev : next));
  }, [box, index]);

  // Focus the main button on every stop; give focus back when the tour ends.
  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
  }, [index]);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  // Keys are handled here first, so the lesson's own shortcuts never see them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Tab") {
        const buttons = Array.from(cardRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        if (buttons.length === 0) return;
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [index, go, onClose]);

  return createPortal(
    <div className={styles.layer}>
      <div className={styles.blocker} aria-hidden="true" />
      {box ? (
        <div className={styles.spot} style={{ top: box.top, left: box.left, width: box.width, height: box.height }} aria-hidden="true" />
      ) : (
        <div className={styles.dim} aria-hidden="true" />
      )}
      <div
        ref={cardRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        style={card ? { top: card.top, left: card.left } : { visibility: "hidden" }}
      >
        <p className={styles.progress}>
          {t("tour.label")} · <span dir="ltr">{t("tour.progress", { n: index + 1, total: steps.length })}</span>
        </p>
        <h2 id={`${id}-title`} className={styles.title}>
          {t(`tour.${step.id}.title`)}
        </h2>
        <p id={`${id}-body`} className={styles.body}>
          {t(`tour.${step.id}.body`)}
        </p>
        <div className={styles.dots} aria-hidden="true">
          {steps.map((s, i) => (
            <i key={s.id} data-on={i === index} />
          ))}
        </div>
        <div className={styles.actions}>
          {!last && (
            <button type="button" className={styles.skip} onClick={() => onClose(false)}>
              {t("tour.skip")}
            </button>
          )}
          {index > 0 && (
            <button type="button" className="btn" onClick={() => go(index - 1)}>
              {t("tour.back")}
            </button>
          )}
          <button ref={primary} type="button" className="btn btn-primary" onClick={() => (last ? onClose(true) : go(index + 1))}>
            {t(last ? "tour.done" : "tour.next")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
