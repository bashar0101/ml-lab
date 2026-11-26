import type { ComponentType } from "react";
import type { LessonContent } from "@/content/schema";
import type { Frame, Trace } from "@/engine/types";

export interface CodeLine {
  text: string;
  /** Frames whose codeLine equals this key highlight this line. */
  key?: string;
}

export interface SceneProps<S, D> {
  trace: Trace<S>;
  index: number;
  data: D;
  /** Which parts of the picture to show; "all" in Lab. */
  reveal: ReadonlySet<string> | "all";
  /** When set (Lab only), the scene may let the student edit the data, e.g. by clicking. */
  onData?: (d: D) => void;
  /**
   * True while the student's edited data is invalid and the trace belongs to older data:
   * draw the current points, but none of the model.
   */
  stale?: boolean;
}

export interface LabControlsProps<P, D> {
  params: P;
  data: D;
  onParams(p: P): void;
  onData(d: D): void;
  labels: Pick<LessonContent["lab"], "presets" | "params">;
}

export interface StatChip {
  labelKey: string;
  /** null renders as "too big"; undefined means "not yet" and renders as a dash. */
  value: number | null | undefined;
  /** Optional suffix such as "/ 40". */
  suffix?: string;
}

export interface LessonModule<S = unknown, P = unknown, D = unknown> {
  slug: string;
  defaultParams: P;
  defaultData: D;
  /** Returns a key into the lesson content's lab.errors, or null when the data is usable. */
  validate(data: D): string | null;
  run(data: D, params: P): Trace<S>;
  Scene: ComponentType<SceneProps<S, D>>;
  LabControls: ComponentType<LabControlsProps<P, D>>;
  code: { python: CodeLine[]; pseudo: CodeLine[] };
  stats(frame: Frame<S>, params?: P): StatChip[];
  /** True when going from `prev` to `next` only changes how the run is shown (playback keeps its place). */
  viewOnly?(prev: P, next: P): boolean;
  /** True when a data edit never changes the trace's shape, so the Lab can stay on the current frame (e.g. drawing a pixel). */
  keepFrameOnData?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyLessonModule = LessonModule<any, any, any>;
