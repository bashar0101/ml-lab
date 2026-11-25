export type Mode = "learn" | "lab";

/** Reads "#lab" or "#step-<n>" (1-based). Anything else means Learn, step 1. */
export function parseHash(hash: string, storyLength: number): { mode: Mode; step: number } {
  const h = hash.replace(/^#/, "").toLowerCase();
  if (h === "lab") return { mode: "lab", step: 0 };
  const m = /^step-(\d+)$/.exec(h);
  if (!m) return { mode: "learn", step: 0 };
  const n = Number(m[1]);
  const step = Math.max(0, Math.min(Math.max(0, storyLength - 1), n - 1));
  return { mode: "learn", step };
}

export function formatHash(mode: Mode, step: number): string {
  if (mode === "lab") return "#lab";
  return step <= 0 ? "" : `#step-${step + 1}`;
}
