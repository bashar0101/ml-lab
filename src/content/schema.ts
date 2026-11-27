import { z } from "zod";

/** Text in the Markdownish subset: **bold**, *italic*, `code`, blank-line paragraphs. */
const md = z.string().min(1);

export const StoryStepSchema = z.object({
  id: z.string().min(1),
  rail: z.string().min(1).max(14),
  title: md,
  body: md,
  keyIdea: md,
  math: md.optional(),
  frameTag: z.string().min(1),
  reveal: z.array(z.string()),
});

/**
 * The words of a lesson's "solve it by hand" example. The numbers come from the lesson's
 * byHand.ts; {var} placeholders are filled from it, {label} ones from `labels`.
 */
export const ByHandSchema = z.object({
  problem: md,
  /** Words that appear inside the example's tables and formulas (e.g. "good", "sunny"). */
  labels: z.record(z.string(), z.string().min(1)),
  steps: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), body: md })).min(2),
  answer: md,
});

export const LessonContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  youWillLearn: z.array(md).min(3).max(6),
  story: z.array(StoryStepSchema).min(6).max(10),
  /** Event explanations; bodies may contain {metric} placeholders. */
  events: z.record(z.string(), z.object({ title: md, body: md })),
  /** Stat chip labels by key. */
  stats: z.record(z.string(), z.string()),
  lab: z.object({
    breakIt: md,
    presets: z.record(z.string(), z.string()),
    params: z.record(z.string(), z.object({ label: z.string().min(1), hint: md.optional() })),
    /** Validation messages by key. */
    errors: z.record(z.string(), md),
  }),
  article: z.object({
    sections: z
      .array(
        z.object({
          heading: z.string().min(1),
          body: md,
          table: z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }).optional(),
        }),
      )
      .min(3),
    faq: z.array(z.object({ q: z.string().min(1), a: md })).min(3),
  }),
  byHand: ByHandSchema.optional(),
});

export type LessonContent = z.infer<typeof LessonContentSchema>;
export type ByHandContent = z.infer<typeof ByHandSchema>;
export type StoryStep = z.infer<typeof StoryStepSchema>;

export const UiSchema = z.record(z.string(), z.string());
export type UiStrings = Record<string, string>;
