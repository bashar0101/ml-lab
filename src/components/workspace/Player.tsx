"use client";

import type { Dispatch } from "react";
import { useT } from "@/i18n/ui-context";
import { SPEEDS, type PlayerAction, type PlayerState } from "@/state/player";
import styles from "./lab.module.css";

const speedLabel = (s: number) => `${s}×`;

export function Player({ state, dispatch }: { state: PlayerState; dispatch: Dispatch<PlayerAction> }) {
  const t = useT();
  const atStart = state.index <= 0;
  const atEnd = state.index >= state.length - 1;
  return (
    <div className={styles.player} role="group" aria-label={t("player.label")} dir="ltr">
      <button type="button" className="btn" onClick={() => dispatch({ type: "first" })} disabled={atStart} aria-label={t("player.first")}>
        <span aria-hidden="true">⏮</span>
      </button>
      <button type="button" className="btn" onClick={() => dispatch({ type: "prev" })} disabled={atStart} aria-label={t("player.back")}>
        <span aria-hidden="true">◀</span>
      </button>
      <button
        type="button"
        className={`btn btn-ink ${styles.play}`}
        onClick={() => dispatch({ type: "toggle" })}
        aria-label={state.playing ? t("player.pause") : t("player.play")}
      >
        <span aria-hidden="true">{state.playing ? "❚❚" : "▶"}</span>
      </button>
      <button type="button" className="btn" onClick={() => dispatch({ type: "next" })} disabled={atEnd} aria-label={t("player.next")}>
        <span aria-hidden="true">▶|</span>
      </button>
      <button type="button" className="btn" onClick={() => dispatch({ type: "last" })} disabled={atEnd} aria-label={t("player.last")}>
        <span aria-hidden="true">⏭</span>
      </button>
      <input
        type="range"
        className={styles.scrubber}
        min={0}
        max={Math.max(0, state.length - 1)}
        value={state.index}
        aria-label={t("player.scrubber")}
        onChange={(e) => dispatch({ type: "seek", index: Number(e.target.value) })}
      />
      <span className={styles.counter} dir="ltr">{t("player.counter", { n: state.index + 1, total: state.length })}</span>
      <div className={styles.speeds} role="group" aria-label={t("player.speed")}>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state.speed === s}
            onClick={() => dispatch({ type: "speed", speed: s })}
          >
            {speedLabel(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
