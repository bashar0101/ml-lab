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
});

export type LessonContent = z.infer<typeof LessonContentSchema>;
export type StoryStep = z.infer<typeof StoryStepSchema>;

export const UiSchema = z.record(z.string(), z.string());
export type UiStrings = Record<string, string>;
