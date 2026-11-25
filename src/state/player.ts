"use client";

import { useEffect, useReducer, type Dispatch } from "react";

export interface PlayerState {
  index: number;
  length: number;
  playing: boolean;
  speed: number;
  /** When set, playback walks toward this index and stops there. */
  target: number | null;
}

export type PlayerAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "first" }
  | { type: "last" }
  | { type: "seek"; index: number }
  | { type: "speed"; speed: number }
  | { type: "load"; length: number }
  | { type: "playTo"; index: number }
  | { type: "tick" };

export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export const BASE_MS = 120;
/** Upper bound on ticks for a playTo jump of up to ~2,000 frames. */
export const PLAY_TO_MAX_TICKS = 20;

const clamp = (i: number, length: number) => Math.max(0, Math.min(length - 1, Math.round(i)));

function stopAt(s: PlayerState, index: number): PlayerState {
  return { ...s, index: clamp(index, s.length), playing: false, target: null };
}

export function playerReducer(s: PlayerState, a: PlayerAction): PlayerState {
  switch (a.type) {
    case "play":
      return { ...s, index: s.index >= s.length - 1 ? 0 : s.index, playing: s.length > 1, target: null };
    case "pause":
      return { ...s, playing: false, target: null };
    case "toggle":
      return s.playing ? playerReducer(s, { type: "pause" }) : playerReducer(s, { type: "play" });
    case "next":
      return stopAt(s, s.index + 1);
    case "prev":
      return stopAt(s, s.index - 1);
    case "first":
      return stopAt(s, 0);
    case "last":
      return stopAt(s, s.length - 1);
    case "seek":
      return stopAt(s, a.index);
    case "speed":
      return { ...s, speed: a.speed };
    case "load":
      return { index: 0, length: Math.max(1, a.length), playing: false, speed: s.speed, target: null };
    case "playTo": {
      const target = clamp(a.index, s.length);
      if (target === s.index) return { ...s, playing: false, target: null };
      return { ...s, playing: true, target };
    }
    case "tick": {
      if (!s.playing) return s;
      if (s.target !== null) {
        // Ease out: cover a quarter of what is left each tick, so even long jumps take
        // under PLAY_TO_MAX_TICKS ticks (about 2 s) instead of one tick per frame.
        const left = s.target - s.index;
        const index = s.index + Math.sign(left) * Math.max(1, Math.ceil(Math.abs(left) / 4));
        return index === s.target ? stopAt(s, index) : { ...s, index };
      }
      if (s.index >= s.length - 1) return { ...s, playing: false };
      const index = s.index + 1;
      return index >= s.length - 1 ? { ...s, index, playing: false } : { ...s, index };
    }
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Player state plus a timer that dispatches "tick" while playing. */
export function usePlayer(length: number): [PlayerState, Dispatch<PlayerAction>] {
  const [state, rawDispatch] = useReducer(playerReducer, {
    index: 0,
    length: Math.max(1, length),
    playing: false,
    speed: 1,
    target: null,
  });

  // Story jumps (playTo) always run at 1×; the speed chips only affect Lab playback.
  const guided = state.target !== null;
  useEffect(() => {
    if (!state.playing) return;
    const id = setInterval(() => rawDispatch({ type: "tick" }), guided ? BASE_MS : BASE_MS / state.speed);
    return () => clearInterval(id);
  }, [state.playing, state.speed, guided]);

  const dispatch: Dispatch<PlayerAction> = (a) => {
    if (a.type === "playTo" && prefersReducedMotion()) rawDispatch({ type: "seek", index: a.index });
    else rawDispatch(a);
  };
  return [state, dispatch];
}
