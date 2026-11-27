"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/i18n/ui-context";
import styles from "./ZoomStage.module.css";

const LEVELS = [1, 1.25, 1.5, 2, 2.5, 3];

/**
 * The lesson picture. In the Lab it gets a small view toolbar: zoom (100–300 %, the picture stays a
 * crisp SVG and scrolls when larger than its frame) and full screen (the browser's own, or a
 * full-window overlay where that API is missing, e.g. iPhone Safari).
 */
export function ZoomStage({ enabled, header, children, className }: { enabled: boolean; header?: ReactNode; children: ReactNode; className?: string }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const [native, setNative] = useState(false);
  const [expandedState, setExpanded] = useState(false);
  const [baseWidth, setBaseWidth] = useState(0);
  // Outside the Lab the picture is always at 100 % and in the page.
  const zoom = enabled ? LEVELS[level] : 1;
  const expanded = enabled && expandedState;
  const full = native || expanded;

  // Leaving the Lab also leaves the browser's full screen (the fullscreenchange listener updates state).
  useEffect(() => {
    if (!enabled && document.fullscreenElement && root.current?.contains(document.fullscreenElement)) void document.exitFullscreen?.();
  }, [enabled]);

  // The picture's natural width at 100 %, so zooming scales from exactly what was on screen.
  useLayoutEffect(() => {
    if (zoom !== 1) return;
    const measure = () => {
      const svg = viewport.current?.querySelector("svg");
      const w = svg?.getBoundingClientRect().width ?? 0;
      if (w > 0) setBaseWidth(w);
    };
    measure();
    if (typeof ResizeObserver === "undefined" || !viewport.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [zoom, full]);

  /** Change zoom while keeping the middle of the view in place. */
  const zoomTo = useCallback((next: number) => {
    const el = viewport.current;
    const clamped = Math.max(0, Math.min(LEVELS.length - 1, next));
    if (el) {
      const cx = (el.scrollLeft + el.clientWidth / 2) / Math.max(1, el.scrollWidth);
      const cy = (el.scrollTop + el.clientHeight / 2) / Math.max(1, el.scrollHeight);
      requestAnimationFrame(() => {
        el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2;
        el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2;
      });
    }
    setLevel(clamped);
  }, []);

  // Ctrl/⌘ + wheel zooms the picture instead of the whole page.
  useEffect(() => {
    const el = viewport.current;
    if (!el || !enabled) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setLevel((l) => Math.max(0, Math.min(LEVELS.length - 1, l + (e.deltaY < 0 ? 1 : -1))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [enabled]);

  useEffect(() => {
    const onChange = () => setNative(!!document.fullscreenElement && document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  const toggleFull = () => {
    if (native) return void document.exitFullscreen?.();
    if (expanded) return setExpanded(false);
    const el = root.current;
    if (el && typeof el.requestFullscreen === "function") el.requestFullscreen().catch(() => setExpanded(true));
    else setExpanded(true);
  };

  return (
    <div ref={root} className={`${className ?? ""} ${styles.stage}`} data-zoom={zoom} data-expanded={expanded} data-full={full}>
      {header}
      {enabled && (
        <div className={styles.toolbar} role="toolbar" aria-label={t("zoom.label")}>
          <button type="button" onClick={() => zoomTo(level - 1)} disabled={level === 0} aria-label={t("zoom.out")} title={t("zoom.out")}>
            −
          </button>
          <button type="button" className={styles.readout} onClick={() => zoomTo(0)} aria-label={t("zoom.reset", { pct: Math.round(zoom * 100) })} title={t("zoom.reset", { pct: Math.round(zoom * 100) })}>
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => zoomTo(level + 1)} disabled={level === LEVELS.length - 1} aria-label={t("zoom.in")} title={t("zoom.in")}>
            +
          </button>
          <button type="button" className={styles.full} onClick={toggleFull} aria-label={t(full ? "zoom.exitFullscreen" : "zoom.fullscreen")} title={t(full ? "zoom.exitFullscreen" : "zoom.fullscreen")}>
            <span aria-hidden="true">{full ? "⤡" : "⤢"}</span>
          </button>
        </div>
      )}
      <div ref={viewport} className={styles.viewport} data-viewport>
        <div className={styles.canvas} style={zoom > 1 ? { inlineSize: baseWidth ? `${baseWidth * zoom}px` : `${zoom * 100}%` } : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
