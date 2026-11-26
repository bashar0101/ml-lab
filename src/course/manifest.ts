export type ChapterId = "foundations" | "classification" | "trees" | "patterns" | "neural" | "deep";

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

export const chapters: Chapter[] = [
  { id: "foundations", number: "01", color: "#d9a866" },
  { id: "classification", number: "02", color: "#5d9a4e" },
  { id: "trees", number: "03", color: "#7a5bc0" },
  { id: "patterns", number: "04", color: "#d0683a" },
  { id: "neural", number: "05", color: "#2f7fc4" },
  { id: "deep", number: "06", color: "#c9496b" },
];

export const lessons: LessonEntry[] = [
  { slug: "linear-regression", chapter: "foundations", minutes: 8, level: "beginner", status: "live" },
  { slug: "gradient-descent", chapter: "foundations", minutes: 10, level: "beginner", status: "live" },
  { slug: "logistic-regression", chapter: "classification", minutes: 10, level: "beginner", status: "live" },
  { slug: "k-nearest-neighbors", chapter: "classification", minutes: 8, level: "beginner", status: "live" },
  { slug: "support-vector-machine", chapter: "classification", minutes: 12, level: "intermediate", status: "live" },
  { slug: "decision-tree", chapter: "trees", minutes: 10, level: "beginner", status: "live" },
  { slug: "random-forest", chapter: "trees", minutes: 10, level: "intermediate", status: "live" },
  { slug: "k-means", chapter: "patterns", minutes: 8, level: "beginner", status: "live" },
  { slug: "pca", chapter: "patterns", minutes: 10, level: "intermediate", status: "live" },
  { slug: "neural-network", chapter: "neural", minutes: 12, level: "intermediate", status: "live" },
  { slug: "backpropagation", chapter: "neural", minutes: 12, level: "intermediate", status: "live" },
  { slug: "convolutional-neural-network", chapter: "deep", minutes: 14, level: "intermediate", status: "live" },
  { slug: "recurrent-neural-network", chapter: "deep", minutes: 12, level: "intermediate", status: "live" },
  { slug: "attention-transformers", chapter: "deep", minutes: 15, level: "intermediate", status: "live" },
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

export function getLesson(slug: string): LessonEntry | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getChapter(id: ChapterId): Chapter {
  const c = chapters.find((ch) => ch.id === id);
  if (!c) throw new Error(`Unknown chapter: ${id}`);
  return c;
}
