"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Markdownish } from "@/components/Markdownish";
import type { LessonContent } from "@/content/schema";
import { interpolate } from "@/engine/text";
import type { Frame } from "@/engine/types";
import { useT } from "@/i18n/ui-context";
import type { CodeLine } from "@/lessons/types";
import { formatStat } from "./bits";
import styles from "./lab.module.css";

const TOO_BIG = 1e6;

export function NowCard({
  frame,
  events,
  playing,
}: {
  frame: Frame<unknown>;
  events: LessonContent["events"];
  /** While playing, the text changes every frame: announcing each one would flood screen readers. */
  playing: boolean;
}) {
  const t = useT();
  const ev = events[frame.event];
  const fmt = (_k: string, v: number) => (Number.isNaN(v) ? t("stat.pending") : !Number.isFinite(v) || Math.abs(v) > TOO_BIG ? t("stat.tooBig") : formatStat(v));
  return (
    <div className={`${styles.card} ${styles.now}`} aria-live={playing ? "off" : "polite"}>
      <h2 className={styles.sec}>{t("now.heading")}</h2>
      {ev ? (
        <>
          <b className={styles.nowTitle}>
            <Markdownish text={interpolate(ev.title, frame.metrics, fmt)} inline />
          </b>
          <div className={styles.nowBody}>
            <Markdownish text={interpolate(ev.body, frame.metrics, fmt)} inline />
          </div>
        </>
      ) : (
        <b className={styles.nowTitle}>{frame.event}</b>
      )}
    </div>
  );
}

export function CodePanel({ code, active }: { code: { python: CodeLine[]; pseudo: CodeLine[] }; active: string }) {
  const t = useT();
  const [tab, setTab] = useState<"python" | "pseudo">("python");
  const [copied, setCopied] = useState(false);
  const lines = code[tab];

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.map((l) => l.text).join("\n"));
      setCopied(true);
    } catch {
      // clipboard unavailable: nothing to do
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.codeHead}>
        <h2 className={styles.sec}>{t("code.heading")}</h2>
        <button type="button" className={styles.copy} onClick={copy}>
          {copied ? t("code.copied") : t("code.copy")}
        </button>
      </div>
      <div className={styles.tabs} role="group">
        <button type="button" aria-pressed={tab === "python"} onClick={() => setTab("python")}>
          {t("code.python")}
        </button>
        <button type="button" aria-pressed={tab === "pseudo"} onClick={() => setTab("pseudo")}>
          {t("code.pseudocode")}
        </button>
      </div>
      <pre className={styles.code}>
        {lines.map((l, i) => {
          const on = !!l.key && l.key === active;
          return (
            <div key={i} className={on ? styles.hl : undefined} aria-current={on ? "true" : undefined}>
              {l.text || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export function LabPanel({
  lab,
  error,
  paper,
  children,
}: {
  lab: LessonContent["lab"];
  error: string | null;
  /** The lesson's "solve it by hand" example: whether it is showing, and how to load it. */
  paper?: { on: boolean; open(): void };
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className={styles.card} data-tour="lab-data">
      <h2 className={styles.sec}>{t("lab.yourData")}</h2>
      {paper && (
        <button type="button" className={styles.paper} aria-pressed={paper.on} onClick={paper.open} data-tour="paper">
          <span aria-hidden="true">✍ </span>
          {t("lab.byHand")}
        </button>
      )}
      {children}
      {error && (
        <p className={styles.error} role="alert">
          {lab.errors[error] ?? error}
        </p>
      )}
      <div className={styles.breakIt} data-tour="break-it">
        <h3 className={styles.sec}>{t("lab.breakIt")}</h3>
        <Markdownish text={lab.breakIt} />
      </div>
    </div>
  );
}
