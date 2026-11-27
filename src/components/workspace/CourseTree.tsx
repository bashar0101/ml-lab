"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  chapters,
  getLesson,
  lessons,
  lessonsInChapter,
  type ChapterId,
} from "@/course/manifest";
import { useLocalePath } from "@/i18n/locale-context";
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
  const to = useLocalePath();
  const done = lessons.filter((l) => completed.has(l.slug)).length;
  const baseId = useId();
  // Accordion: the current lesson's chapter starts open; the others fold away.
  const [open, setOpen] = useState<ReadonlySet<ChapterId>>(() => {
    const ch = getLesson(currentSlug)?.chapter;
    return new Set(ch ? [ch] : []);
  });
  const toggle = (id: ChapterId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav className={styles.tree} aria-label={t("course.heading")}>
      <h2 className={styles.heading}>
        {t("course.heading")}{" "}
        <span>{t("course.lessons", { n: lessons.length })}</span>
      </h2>
      <ol className={styles.chapters}>
        {chapters.map((ch) => {
          const list = lessonsInChapter(ch.id);
          const chDone = list.filter((l) => completed.has(l.slug)).length;
          const isOpen = open.has(ch.id);
          const panelId = `${baseId}-${ch.id}`;
          return (
            <li key={ch.id}>
              <button
                type="button"
                className={styles.chapter}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(ch.id)}
              >
                <span
                  className={styles.swatch}
                  style={{ background: ch.color }}
                  aria-hidden="true"
                />
                <span className={styles.chapterName}>
                  {ch.number}. {t(`chapter.${ch.id}`)}
                </span>
                <span className={styles.count}>
                  {t("course.chapterDone", {
                    done: chDone,
                    total: list.length,
                  })}
                </span>
                <span className={styles.chevron} aria-hidden="true" />
              </button>
              <div
                id={panelId}
                className={styles.panel}
                data-open={isOpen}
                inert={!isOpen}
              >
                <ol className={styles.lessons}>
                  {list.map((l) => {
                    const title = t(`lesson.${l.slug}.title`);
                    if (l.status !== "live")
                      return (
                        <li key={l.slug} className={styles.soon}>
                          <span>{title}</span>{" "}
                          <span className={styles.badge}>
                            {t("lesson.comingSoon")}
                          </span>
                        </li>
                      );
                    const current = l.slug === currentSlug;
                    return (
                      <li key={l.slug}>
                        <Link
                          href={to(`/lessons/${l.slug}/`)}
                          className={
                            current
                              ? `${styles.lesson} ${styles.current}`
                              : styles.lesson
                          }
                          aria-current={current ? "page" : undefined}
                          onClick={onNavigate}
                        >
                          {title}
                          {completed.has(l.slug) && (
                            <span aria-hidden="true"> ✓</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
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
