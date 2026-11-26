export type ChapterId = "foundations" | "classification" | "evaluation" | "trees" | "patterns" | "neural" | "deep" | "generative";

export interface Chapter {
  id: ChapterId;
  /** Display number, e.g. "01". */
  number: string;
  /** Swatch colour (hex); matches --ch-<id> in tokens.css. */
  color: string;
}

export interface LessonEntry {
  slug: string;
  chapter: ChapterId;
  status: "live" | "soon";
  minutes: number;
  level: "beginner" | "intermediate";
}

/** Chapter order follows the usual university sequence (Stanford CS229, MIT 6.036, the Ng ML and DL specializations). */
export const chapters: Chapter[] = [
  { id: "foundations", number: "01", color: "#d9a866" },
  { id: "classification", number: "02", color: "#5d9a4e" },
  { id: "evaluation", number: "03", color: "#2a9d8f" },
  { id: "trees", number: "04", color: "#7a5bc0" },
  { id: "patterns", number: "05", color: "#d0683a" },
  { id: "neural", number: "06", color: "#2f7fc4" },
  { id: "deep", number: "07", color: "#c9496b" },
  { id: "generative", number: "08", color: "#5c6b73" },
];

const live = (slug: string, chapter: ChapterId, minutes: number, level: LessonEntry["level"]): LessonEntry => ({ slug, chapter, minutes, level, status: "live" });
const soon = (slug: string, chapter: ChapterId, minutes: number, level: LessonEntry["level"]): LessonEntry => ({ slug, chapter, minutes, level, status: "soon" });

export const lessons: LessonEntry[] = [
  // 01 Foundations: supervised learning as fitting a function.
  live("linear-regression", "foundations", 8, "beginner"),
  live("gradient-descent", "foundations", 10, "beginner"),
  soon("feature-scaling", "foundations", 8, "beginner"),
  soon("polynomial-regression", "foundations", 10, "beginner"),
  soon("regularization", "foundations", 10, "intermediate"),
  // 02 Classification.
  soon("perceptron", "classification", 8, "beginner"),
  live("logistic-regression", "classification", 10, "beginner"),
  soon("naive-bayes", "classification", 10, "beginner"),
  live("k-nearest-neighbors", "classification", 8, "beginner"),
  live("support-vector-machine", "classification", 12, "intermediate"),
  soon("kernel-trick", "classification", 12, "intermediate"),
  // 03 Evaluating models.
  soon("train-test-cross-validation", "evaluation", 10, "beginner"),
  soon("bias-variance", "evaluation", 10, "intermediate"),
  soon("confusion-matrix", "evaluation", 10, "beginner"),
  soon("roc-auc", "evaluation", 10, "intermediate"),
  // 04 Trees & ensembles.
  live("decision-tree", "trees", 10, "beginner"),
  live("random-forest", "trees", 10, "intermediate"),
  soon("adaboost", "trees", 10, "intermediate"),
  soon("gradient-boosting", "trees", 12, "intermediate"),
  // 05 Unsupervised learning.
  live("k-means", "patterns", 8, "beginner"),
  soon("hierarchical-clustering", "patterns", 10, "beginner"),
  soon("dbscan", "patterns", 10, "intermediate"),
  soon("gaussian-mixture-models", "patterns", 12, "intermediate"),
  live("pca", "patterns", 10, "intermediate"),
  soon("t-sne", "patterns", 12, "intermediate"),
  // 06 Neural networks.
  live("neural-network", "neural", 12, "intermediate"),
  live("backpropagation", "neural", 12, "intermediate"),
  soon("softmax-multiclass", "neural", 10, "intermediate"),
  soon("dropout-early-stopping", "neural", 10, "intermediate"),
  soon("optimizers", "neural", 12, "intermediate"),
  soon("batch-normalization", "neural", 10, "intermediate"),
  // 07 Deep learning.
  live("convolutional-neural-network", "deep", 14, "intermediate"),
  live("recurrent-neural-network", "deep", 12, "intermediate"),
  soon("lstm-gru", "deep", 12, "intermediate"),
  soon("word-embeddings", "deep", 12, "intermediate"),
  live("attention-transformers", "deep", 15, "intermediate"),
  // 08 Generative models & reinforcement learning.
  soon("autoencoders", "generative", 12, "intermediate"),
  soon("gans", "generative", 14, "intermediate"),
  soon("diffusion-models", "generative", 14, "intermediate"),
  soon("reinforcement-learning", "generative", 14, "intermediate"),
];

export function liveLessons(): LessonEntry[] {
  return lessons.filter((l) => l.status === "live");
}

export function lessonsInChapter(id: ChapterId): LessonEntry[] {
  return lessons.filter((l) => l.chapter === id);
}

export function nextLesson(slug: string): LessonEntry | undefined {
  const i = lessons.findIndex((l) => l.slug === slug);
  return i === -1 ? undefined : lessons[i + 1];
}

/** 1-based position in the whole course; 0 if unknown. */
export function lessonIndex(slug: string): number {
  return lessons.findIndex((l) => l.slug === slug) + 1;
}

/** The next lesson that can be opened today, skipping ones still coming. */
export function nextLiveLesson(slug: string): LessonEntry | undefined {
  const i = lessons.findIndex((l) => l.slug === slug);
  return i === -1 ? undefined : lessons.slice(i + 1).find((l) => l.status === "live");
}

export function getLesson(slug: string): LessonEntry | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getChapter(id: ChapterId): Chapter {
  const c = chapters.find((ch) => ch.id === id);
  if (!c) throw new Error(`Unknown chapter: ${id}`);
  return c;
}
