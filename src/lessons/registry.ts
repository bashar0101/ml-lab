import type { AnyLessonModule } from "./types";

/** Each lesson loads on demand so a lesson page only ships its own code. */
const modules: Record<string, () => Promise<{ default: AnyLessonModule }>> = {
  "linear-regression": () => import("./linear-regression"),
  "gradient-descent": () => import("./gradient-descent"),
  "logistic-regression": () => import("./logistic-regression"),
  "k-nearest-neighbors": () => import("./k-nearest-neighbors"),
  "support-vector-machine": () => import("./support-vector-machine"),
  "decision-tree": () => import("./decision-tree"),
  "random-forest": () => import("./random-forest"),
  "k-means": () => import("./k-means"),
  pca: () => import("./pca"),
  "neural-network": () => import("./neural-network"),
};

export function hasLessonModule(slug: string): boolean {
  return slug in modules;
}

export async function loadLessonModule(slug: string): Promise<AnyLessonModule> {
  const load = modules[slug];
  if (!load) throw new Error(`No lesson module for "${slug}"`);
  return (await load()).default;
}
