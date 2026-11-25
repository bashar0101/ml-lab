/** One recorded moment of an algorithm run. The scene renders exactly this. */
export interface Frame<S> {
  state: S;
  /** Key of the code line that just ran (matches CodeLine.key in both code tabs). */
  codeLine: string;
  /** Key into the lesson content's `events` for the explanation. */
  event: string;
  metrics: Record<string, number>;
  /** Named moments that story steps can jump to. */
  tags: string[];
}

export interface Trace<S> {
  frames: Frame<S>[];
  meta: { algorithm: string; seed: number; truncated: boolean };
}

export function frameIndexOfTag<S>(trace: Trace<S>, tag: string): number {
  return trace.frames.findIndex((f) => f.tags.includes(tag));
}
