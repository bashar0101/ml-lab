"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/ui-context";
import { searchEntries, type SearchEntry } from "@/search";
import { isTyping } from "@/state/keys";
import bar from "./TopBar.module.css";
import styles from "./SearchPalette.module.css";

async function fetchIndex(): Promise<SearchEntry[]> {
  const res = await fetch("/search-index.json");
  if (!res.ok) throw new Error(`search index: ${res.status}`);
  return res.json();
}

const goTo = (href: string) => window.location.assign(href);

export interface SearchPaletteProps {
  /** Overridable for tests. */
  loadIndex?: () => Promise<SearchEntry[]>;
  navigate?: (href: string) => void;
}

/** The top-bar search button and its Ctrl K command palette. */
export function SearchPalette({
  loadIndex = fetchIndex,
  navigate = goTo,
}: SearchPaletteProps) {
  const t = useT();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchEntry[] | "error" | null>(null);
  const loading = useRef(false);
  const button = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
    if (!loading.current) {
      loading.current = true;
      loadIndex().then(setIndex, () => {
        loading.current = false;
        setIndex("error");
      });
    }
  }, [loadIndex]);

  const hide = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();
        if (open) hide();
        else show();
      } else if (
        e.key === "/" &&
        !open &&
        !e.ctrlKey &&
        !e.metaKey &&
        !isTyping(e.target)
      ) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show, hide]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const results = useMemo(
    () => (Array.isArray(index) ? searchEntries(index, query) : []),
    [index, query],
  );
  const current = Math.min(active, Math.max(0, results.length - 1));

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length)
        setActive(
          (current + (e.key === "ArrowDown" ? 1 : -1) + results.length) %
            results.length,
        );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[current];
      if (hit) {
        setOpen(false);
        navigate(hit.href);
      }
    } else if (e.key === "Tab") {
      // The palette has one control; keep focus inside it.
      e.preventDefault();
    }
  };

  const optionId = (k: number) => `${id}-opt-${k}`;
  const status =
    index === "error"
      ? t("search.error")
      : index === null
        ? t("search.loading")
        : !query.trim()
          ? t("search.hint")
          : results.length === 0
            ? t("search.empty")
            : null;

  return (
    <>
      <button
        ref={button}
        type="button"
        className={bar.search}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K /"
        aria-label={t("nav.search")}
        onClick={show}
      >
        <span className={bar.searchLabel}>{t("nav.search")}</span>
        <span className={bar.searchIcon} aria-hidden="true">
          ⌕
        </span>
        <span className={bar.kbd} aria-hidden="true">
          Ctrl K
        </span>
      </button>
      {open &&
        createPortal(
          <div
            className={styles.backdrop}
            onMouseDown={(e) => e.target === e.currentTarget && hide()}
          >
            <div
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-label={t("search.label")}
            >
              <input
                ref={input}
                className={styles.input}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={
                  results.length ? optionId(current) : undefined
                }
                aria-label={t("search.label")}
                placeholder={t("search.placeholder")}
                value={query}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
              />
              <ul
                id={`${id}-list`}
                role="listbox"
                className={styles.list}
                aria-label={t("search.results")}
                onMouseDown={(e) => e.preventDefault()}
              >
                {results.map((r, k) => (
                  <li
                    key={`${r.href}-${r.kind}-${r.title}`}
                    id={optionId(k)}
                    role="option"
                    aria-selected={k === current}
                    className={styles.option}
                    onMouseMove={() => setActive(k)}
                  >
                    <a
                      href={r.href}
                      tabIndex={-1}
                      className={styles.link}
                      onClick={() => setOpen(false)}
                    >
                      <span className={styles.title}>{r.title}</span>
                      <span className={styles.meta}>
                        <span className={styles.kind}>
                          {t(`search.kind.${r.kind}`)}
                        </span>
                        {r.kind !== "lesson" && r.lesson}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              {status && (
                <p className={styles.status} role="status">
                  {status}
                </p>
              )}
              <p className={styles.keys} aria-hidden="true">
                {t("search.keys")}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
