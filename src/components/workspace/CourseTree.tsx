"use client";

import Link from "next/link";
import { chapters, lessons, lessonsInChapter } from "@/course/manifest";
import { useT } from "@/i18n/ui-context";
import styles from "./CourseTree.module.css";

export function CourseTree({
  currentSlug,
  completed,
  onNavigate,
}: {
  currentSlug: string;
  completed: ReadonlySet<string>;
  onNavigate?: () => void;
}) {
  const t = useT();
  const done = lessons.filter((l) => completed.has(l.slug)).length;

  return (
    <nav className={styles.tree} aria-label={t("course.heading")}>
      <h2 className={styles.heading}>
        {t("course.heading")} <span>{t("course.lessons", { n: lessons.length })}</span>
      </h2>
      <ol className={styles.chapters}>
        {chapters.map((ch) => {
          const list = lessonsInChapter(ch.id);
          const chDone = list.filter((l) => completed.has(l.slug)).length;
          return (
            <li key={ch.id}>
              <div className={styles.chapter}>
                <span className={styles.swatch} style={{ background: ch.color }} aria-hidden="true" />
                <span>
                  {ch.number}. {t(`chapter.${ch.id}`)}
                </span>
                <span className={styles.count}>{t("course.chapterDone", { done: chDone, total: list.length })}</span>
              </div>
              <ol className={styles.lessons}>
                {list.map((l) => {
                  const title = t(`lesson.${l.slug}.title`);
                  if (l.status !== "live")
                    return (
                      <li key={l.slug} className={styles.soon}>
                        <span>{title}</span> <span className={styles.badge}>{t("lesson.comingSoon")}</span>
                      </li>
                    );
                  const current = l.slug === currentSlug;
                  return (
                    <li key={l.slug}>
                      <Link
                        href={`/lessons/${l.slug}/`}
                        className={current ? `${styles.lesson} ${styles.current}` : styles.lesson}
                        aria-current={current ? "page" : undefined}
                        onClick={onNavigate}
                      >
                        {title}
                        {completed.has(l.slug) && <span aria-hidden="true"> ✓</span>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
      <div className={styles.progress}>
        <div className={styles.progressRow}>
          <span>{t("progress.label")}</span>
          <span>{t("progress.count", { done, total: lessons.length })}</span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label={t("progress.label")}
          aria-valuemin={0}
          aria-valuemax={lessons.length}
          aria-valuenow={done}
        >
          <i style={{ inlineSize: `${(done / lessons.length) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}
