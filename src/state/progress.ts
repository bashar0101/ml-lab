export interface LessonProgress {
  lastStep: number;
  completed: boolean;
}

export const PROGRESS_KEY = "mllab:progress";

type ProgressMap = Record<string, LessonProgress>;

const EMPTY: LessonProgress = { lastStep: 0, completed: false };

function isProgress(v: unknown): v is LessonProgress {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return typeof p.lastStep === "number" && Number.isFinite(p.lastStep) && typeof p.completed === "boolean";
}

function read(storage: Storage | null): ProgressMap {
  if (!storage) return {};
  try {
    const raw = storage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: ProgressMap = {};
    for (const [k, v] of Object.entries(parsed)) if (isProgress(v)) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

/** Progress kept in memory and mirrored to storage when storage works. */
export function createProgressStore(storage: Storage | null) {
  const data = read(storage);

  function save() {
    if (!storage) return;
    try {
      storage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch {
      // storage blocked or full: keep going in memory
    }
  }

  return {
    get(slug: string): LessonProgress {
      return { ...(data[slug] ?? EMPTY) };
    },
    reachStep(slug: string, step: number) {
      const cur = data[slug] ?? EMPTY;
      if (step <= cur.lastStep && data[slug]) return;
      data[slug] = { ...cur, lastStep: Math.max(cur.lastStep, step) };
      save();
    },
    complete(slug: string) {
      data[slug] = { ...(data[slug] ?? EMPTY), completed: true };
      save();
    },
    completedCount(): number {
      return Object.values(data).filter((p) => p.completed).length;
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;

export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
