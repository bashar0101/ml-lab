"use client";

import { useEffect, useRef } from "react";

export interface LessonKeyHandlers {
  next(): void;
  prev(): void;
  togglePlay(): void;
  replay(): void;
  toggleMode(): void;
}

export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** ←/→, Space, R, L for the lesson workspace. Ignored while typing or with modifiers. */
export function useLessonKeys(handlers: LessonKeyHandlers, isActive: () => boolean = () => true): void {
  const ref = useRef(handlers);
  const activeRef = useRef(isActive);
  useEffect(() => {
    ref.current = handlers;
    activeRef.current = isActive;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      // Off screen (e.g. reading the article below), Space must scroll and R/L must do nothing.
      if (!activeRef.current()) return;
      const h = ref.current;
      switch (e.key) {
        case "ArrowRight":
          h.next();
          break;
        case "ArrowLeft":
          h.prev();
          break;
        case " ":
          // Space on a focused button should click that button, not play/pause.
          if (e.target instanceof HTMLElement && e.target.closest("button, a, summary")) return;
          h.togglePlay();
          break;
        case "r":
        case "R":
          h.replay();
          break;
        case "l":
        case "L":
          h.toggleMode();
          break;
        default:
          return;
      }
      e.preventDefault();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
