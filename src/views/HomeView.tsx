import type { Metadata } from "next";
import Link from "next/link";
import { HeroDemo } from "@/components/HeroDemo";
import styles from "@/components/home.module.css";
import { Markdownish } from "@/components/Markdownish";
import { loadUi } from "@/content/load";
import { chapters, lessonIndex, lessonsInChapter } from "@/course/manifest";
import { alternates, localePath, type Locale } from "@/i18n/locales";
import { translate } from "@/i18n/translate";

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const ui = await loadUi(locale);
  return {
    title: { absolute: `${ui["site.name"]} · ${ui["site.tagline"]}` },
    description: ui["site.description"],
    alternates: { canonical: localePath(locale, "/"), languages: alternates("/") },
  };
}

export async function HomeView({ locale }: { locale: Locale }) {
  const ui = await loadUi(locale);
  const to = (p: string) => localePath(locale, p);
  const t = (k: string, v?: Record<string, string | number>) => translate(ui, k, v);
  const faq = [1, 2, 3, 4];

  return (
    <main>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
        <h1 className={styles.title}>
          <Markdownish text={t("home.title")} inline />
        </h1>
        <p className={styles.subtitle}>{t("home.subtitle")}</p>
        <div className={styles.ctas}>
          <Link href={to("/lessons/linear-regression/")} className="btn btn-ink">
            {t("home.start")}
          </Link>
          <a href="#lessons" className="btn">
            {t("home.allLessons")}
          </a>
        </div>
        <HeroDemo />
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>{t("home.how.title")}</h2>
        <ol className={styles.how}>
          {(["learn", "lab", "break"] as const).map((k) => (
            <li key={k} className={styles.howCard} data-step={k}>
              <h3>{t(`home.how.${k}.title`)}</h3>
              <p>{t(`home.how.${k}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>{t("home.chapters.title")}</h2>
        <div className={styles.chapters}>
          {chapters.map((ch) => {
            const list = lessonsInChapter(ch.id);
            const live = list.filter((l) => l.status === "live").length;
            return (
              <a key={ch.id} href={`#chapter-${ch.id}`} className={styles.chapterCard} data-chapter-card>
                <span className={styles.swatch} style={{ background: ch.color }} aria-hidden="true" />
                <span className={styles.chNumber}>{ch.number}</span>
                <span className={styles.chTitle}>{t(`chapter.${ch.id}`)}</span>
                <span className={styles.chBlurb}>{t(`chapter.${ch.id}.blurb`)}</span>
                <span className={styles.chCount}>{t("home.chapters.count", { n: list.length, live })}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className={styles.section} id="lessons">
        <h2 className={styles.h2}>{t("home.lessons.title")}</h2>
        <div className={styles.lessonGroups}>
          {chapters.map((ch) => (
            <div key={ch.id} id={`chapter-${ch.id}`} className={styles.group}>
              <h3 className={styles.groupTitle}>
                <span className={styles.swatch} style={{ background: ch.color }} aria-hidden="true" />
                {ch.number}. {t(`chapter.${ch.id}`)}
              </h3>
              <ol className={styles.lessonList}>
                {lessonsInChapter(ch.id).map((l) => {
                  const title = t(`lesson.${l.slug}.title`);
                  const meta = `${t("lesson.minutes", { n: l.minutes })} · ${t(`level.${l.level}`)}`;
                  return (
                    <li key={l.slug} data-lesson-status={l.status}>
                      <span className={styles.lessonNo}>{String(lessonIndex(l.slug)).padStart(2, "0")}</span>
                      {l.status === "live" ? (
                        <Link href={to(`/lessons/${l.slug}/`)} className={styles.lessonTitle}>
                          {title}
                        </Link>
                      ) : (
                        <span className={styles.lessonTitle}>{title}</span>
                      )}
                      <span className={styles.lessonMeta}>{meta}</span>
                      {l.status === "soon" && <span className={styles.soon}>{t("lesson.comingSoon")}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>{t("home.faqTitle")}</h2>
        <div className={styles.faq}>
          {faq.map((n) => (
            <details key={n}>
              <summary>{t(`home.faq.${n}.q`)}</summary>
              <p>{t(`home.faq.${n}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
