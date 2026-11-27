"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ByHandContent } from "@/content/schema";
import { interpolate } from "@/engine/text";
import { useT } from "@/i18n/ui-context";
import type { HandBlock, HandExample, HandTable } from "@/lessons/shared/hand";
import styles from "./ByHand.module.css";
import { Markdownish } from "./Markdownish";

// Each number dropped into a sentence is isolated, so "−72" keeps its minus sign on the left
// even inside Arabic text. The marks are invisible.
const LRI = "\u2066";
const PDI = "\u2069";

type Fill = (s: string) => string;

// A mean is written with a bar: x̄ (x + combining macron) or ȳ. Monospace fonts place a
// combining macron over the wrong character, so the bar is drawn with CSS instead.
const BARRED = /([A-Za-z])\u0304|\u0233/g;

function notation(s: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(BARRED)) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    parts.push(
      <span key={m.index} className={styles.bar} data-bar="">
        {m[1] ?? "y"}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (!parts.length) return s;
  parts.push(s.slice(last));
  return parts;
}

function Table({ table, word }: { table: HandTable; word: Fill }) {
  return (
    <div className={styles.tableWrap}>
      {/* Tables read left to right in every language: grids such as images must not be mirrored. */}
      <table className={styles.table} dir="ltr">
        {table.caption && (
          <caption className={styles.caption}>
            <bdi>{notation(word(table.caption))}</bdi>
          </caption>
        )}
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} scope="col">
                <bdi>{notation(word(h))}</bdi>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} data-mark={table.mark?.includes(i) || undefined}>
              {row.map((c, j) => (
                <td key={j}>
                  <bdi>{notation(word(c))}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {table.foot && (
          <tfoot>
            <tr>
              {table.foot.map((c, j) => (
                <td key={j}>
                  <bdi>{notation(word(c))}</bdi>
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function Block({ block, word }: { block: HandBlock; word: Fill }) {
  if ("table" in block) return <Table table={block.table} word={word} />;
  return (
    <div className={styles.math} dir="ltr">
      {block.math.map((line, i) => (
        <div key={i}>{notation(word(line))}</div>
      ))}
    </div>
  );
}

/**
 * "Solve it by hand": a small problem, then its solution one step at a time, like working it
 * out on paper. The numbers are computed at build time (lessons/<slug>/byHand.ts); the words
 * come from the lesson content.
 */
export function ByHand({ example, text }: { example: HandExample; text: ByHandContent }) {
  const t = useT();
  const total = example.steps.length;
  const [shown, setShown] = useState(0);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const focusOn = useRef<number | null>(null);

  // After a reveal, move focus (and the view) to the first new step.
  useEffect(() => {
    if (focusOn.current === null) return;
    headings.current[focusOn.current]?.focus();
    focusOn.current = null;
  }, [shown]);

  const reveal = (n: number) => {
    focusOn.current = shown;
    setShown(n);
  };

  const word: Fill = (s) => interpolate(s, text.labels);
  const vars: Record<string, string> = Object.assign({}, example.vars, ...example.steps.map((s) => s.vars ?? {}));
  const isolated = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, LRI + v + PDI]));
  // Values may name a word ("{good}"), so words are filled after the values.
  const prose: Fill = (s) => word(interpolate(s, isolated));

  return (
    <section className={styles.byHand} aria-labelledby="by-hand">
      <div className={styles.paper}>
        <h2 id="by-hand" className={styles.heading}>
          <span aria-hidden="true">✍ </span>
          {t("byHand.heading")}
        </h2>
        <p className={styles.lead}>{t("byHand.lead")}</p>

        <div className={styles.problem} data-testid="problem">
          <h3 className={styles.label}>{t("byHand.problem")}</h3>
          <Markdownish text={prose(text.problem)} code={notation} />
          {example.given.map((b, i) => (
            <Block key={i} block={b} word={word} />
          ))}
        </div>

        {shown > 0 && (
          <ol className={styles.steps}>
            {example.steps.slice(0, shown).map((step, i) => (
              <li key={step.id} className={styles.step}>
                <h3
                  className={styles.stepTitle}
                  tabIndex={-1}
                  ref={(el) => {
                    headings.current[i] = el;
                  }}
                >
                  <span className={styles.num} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.stepName}>{t("byHand.step", { n: i + 1 })}</span>
                  <span>{prose(text.steps[i].title)}</span>
                </h3>
                <Markdownish text={prose(text.steps[i].body)} code={notation} />
                {step.blocks.map((b, j) => (
                  <Block key={j} block={b} word={word} />
                ))}
              </li>
            ))}
          </ol>
        )}

        {shown === total && (
          <div className={styles.answer} data-testid="answer">
            <h3 className={styles.label}>{t("byHand.answer")}</h3>
            <Markdownish text={prose(text.answer)} code={notation} />
          </div>
        )}

        <div className={styles.controls}>
          {shown < total && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => reveal(shown + 1)}>
                {t("byHand.next", { n: shown + 1 })}
              </button>
              <button type="button" className="btn" onClick={() => reveal(total)}>
                {t("byHand.all")}
              </button>
            </>
          )}
          {shown > 0 && (
            <button type="button" className="btn" onClick={() => setShown(0)}>
              {t("byHand.reset")}
            </button>
          )}
          <span className={styles.count} dir="ltr" aria-hidden="true">
            {shown} / {total}
          </span>
        </div>
      </div>
    </section>
  );
}
