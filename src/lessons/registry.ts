import type { AnyLessonModule } from "./types";

/** Each lesson loads on demand so a lesson page only ships its own code. */
const modules: Record<string, () => Promise<{ default: AnyLessonModule }>> = {
  "linear-regression": () => import("./linear-regression"),
  "gradient-descent": () => import("./gradient-descent"),
  "logistic-regression": () => import("./logistic-regression"),
};

export function hasLessonModule(slug: string): boolean {
  return slug in modules;
}

export async function loadLessonModule(slug: string): Promise<AnyLessonModule> {
  const load = modules[slug];
  if (!load) throw new Error(`No lesson module for "${slug}"`);
  return (await load()).default;
}
