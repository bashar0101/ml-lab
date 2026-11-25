import Link from "next/link";
import { Markdownish } from "@/components/Markdownish";
import type { LessonContent, UiStrings } from "@/content/schema";
import { getChapter, getLesson, nextLesson } from "@/course/manifest";
import { translate } from "@/i18n/translate";
import styles from "./LessonArticle.module.css";

const BUILT = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function LessonArticle({ slug, content, ui }: { slug: string; content: LessonContent; ui: UiStrings }) {
  const t = (k: string, v?: Record<string, string | number>) => translate(ui, k, v);
  const entry = getLesson(slug)!;
  const chapter = getChapter(entry.chapter);
  const next = nextLesson(slug);

  return (
    <article className={styles.article}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">{t("article.breadcrumbHome")}</Link> <span aria-hidden="true">/</span>{" "}
        <span>
          {chapter.number}. {t(`chapter.${chapter.id}`)}
        </span>{" "}
        <span aria-hidden="true">/</span> <span>{content.title}</span>
      </nav>

      {content.article.sections.map((s) => (
        <section key={s.heading} className={styles.section}>
          <h2>{s.heading}</h2>
          <Markdownish text={s.body} />
          {s.table && (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    {s.table.headers.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j}>
                          <Markdownish text={c} inline />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section className={styles.section}>
        <h2>{t("article.faq")}</h2>
        {content.article.faq.map((f) => (
          <details key={f.q} className={styles.faq}>
            <summary>{f.q}</summary>
            <Markdownish text={f.a} />
          </details>
        ))}
      </section>

      {next && (
        <section className={styles.section}>
          <h2>{t("article.keepLearning")}</h2>
          <div className={styles.next}>
            <span className={styles.nextLabel}>{t("article.next")}</span>
            {next.status === "live" ? (
              <Link href={`/lessons/${next.slug}/`} className={styles.nextTitle}>
                {t(`lesson.${next.slug}.title`)} →
              </Link>
            ) : (
              <span className={styles.nextTitle}>
                {t(`lesson.${next.slug}.title`)} <span className={styles.soon}>{t("lesson.comingSoon")}</span>
              </span>
            )}
          </div>
        </section>
      )}

      <p className={styles.updated}>{t("article.updated", { date: BUILT })}</p>
    </article>
  );
}
