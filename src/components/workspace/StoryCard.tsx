"use client";

import { Markdownish } from "@/components/Markdownish";
import type { StoryStep } from "@/content/schema";
import { useT } from "@/i18n/ui-context";
import styles from "./StoryCard.module.css";

export function StoryCard({
  step,
  index,
  total,
  nextRail,
  onBack,
  onNext,
}: {
  step: StoryStep;
  index: number;
  total: number;
  /** Rail name of the next step; undefined on the last step. */
  nextRail?: string;
  onBack(): void;
  onNext(): void;
}) {
  const t = useT();
  return (
    <div className={styles.card}>
      <div aria-live="polite">
        <div className={styles.eyebrow}>{t("story.stepOf", { n: index + 1, total })}</div>
        <h2 className={styles.title}>
          <Markdownish text={step.title} inline />
        </h2>
        <div className={styles.body}>
          <Markdownish text={step.body} />
        </div>
        <div className={styles.idea} data-tour="key-idea">
          <small>{t("story.keyIdea")}</small>
          <Markdownish text={step.keyIdea} inline />
        </div>
      </div>
      {step.math && (
        <details className={styles.math} key={step.id}>
          <summary>{t("story.showMath")}</summary>
          <div className={styles.mathBody}>
            <Markdownish text={step.math} />
          </div>
        </details>
      )}
      <div className={styles.nav}>
        <button type="button" className="btn" onClick={onBack} disabled={index === 0}>
          {t("story.back")}
        </button>
        <button type="button" className={`btn btn-primary ${styles.next}`} onClick={onNext}>
          {nextRail ? t("story.next", { name: nextRail }) : t("story.toLab")}
          <span className="flip-rtl" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

export function YouWillLearn({ items, step, total }: { items: string[]; step: number; total: number }) {
  const t = useT();
  const reachedAt = (i: number) => (items.length <= 1 ? 0 : Math.round((i * (total - 1)) / (items.length - 1)));
  return (
    <div className={styles.learn}>
      <h3 className={styles.learnHeading}>{t("youWillLearn.heading")}</h3>
      <ul>
        {items.map((item, i) => {
          const done = step >= reachedAt(i);
          return (
            <li key={i} data-done={done}>
              <span className={styles.box} aria-hidden="true">
                {done ? "✓" : ""}
              </span>
              <Markdownish text={item} inline />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
