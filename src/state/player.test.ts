import { describe, expect, it } from "vitest";
import { PLAY_TO_MAX_TICKS, playerReducer, type PlayerState } from "./player";

const init = (length: number): PlayerState => ({ index: 0, length, playing: false, speed: 1, target: null });

describe("playerReducer", () => {
  it("playTo animates to the target and stops there", () => {
    let s = playerReducer(init(121), { type: "playTo", index: 3 });
    expect(s.playing).toBe(true);
    for (let i = 0; i < 10; i++) s = playerReducer(s, { type: "tick" });
    expect(s).toMatchObject({ index: 3, playing: false, target: null });
  });

  it("playTo arrives within PLAY_TO_MAX_TICKS however far the target is", () => {
    let s = playerReducer({ ...init(122), index: 24 }, { type: "playTo", index: 121 });
    let ticks = 0;
    while (s.playing && ticks < 500) {
      s = playerReducer(s, { type: "tick" });
      ticks++;
    }
    expect(s.index).toBe(121);
    expect(ticks).toBeLessThanOrEqual(PLAY_TO_MAX_TICKS);
  });

  it("playTo backwards moves down toward the target", () => {
    let s = playerReducer({ ...init(121), index: 10 }, { type: "playTo", index: 2 });
    s = playerReducer(s, { type: "tick" });
    expect(s.index).toBeLessThan(10);
    expect(s.index).toBeGreaterThan(2);
  });

  it("playTo the current index does not start playing", () => {
    expect(playerReducer({ ...init(10), index: 4 }, { type: "playTo", index: 4 })).toMatchObject({ playing: false, target: null });
  });

  it("load resets and stops even while playing", () => {
    const s = playerReducer({ ...init(121), index: 50, playing: true, speed: 2 }, { type: "load", length: 30 });
    expect(s).toEqual({ index: 0, length: 30, playing: false, speed: 2, target: null });
  });

  it("seek clamps and stops", () => {
    expect(playerReducer({ ...init(10), playing: true }, { type: "seek", index: 99 })).toMatchObject({ index: 9, playing: false });
    expect(playerReducer(init(10), { type: "seek", index: -5 }).index).toBe(0);
  });

  it("play at the end restarts from 0", () => {
    expect(playerReducer({ ...init(10), index: 9 }, { type: "play" })).toMatchObject({ index: 0, playing: true });
  });

  it("tick at the end stops playback", () => {
    const s = playerReducer({ ...init(3), index: 2, playing: true }, { type: "tick" });
    expect(s).toMatchObject({ index: 2, playing: false });
  });

  it("next/prev/first/last move and stop", () => {
    const playing = { ...init(10), index: 5, playing: true };
    expect(playerReducer(playing, { type: "next" })).toMatchObject({ index: 6, playing: false });
    expect(playerReducer(playing, { type: "prev" })).toMatchObject({ index: 4, playing: false });
    expect(playerReducer(playing, { type: "first" }).index).toBe(0);
    expect(playerReducer(playing, { type: "last" }).index).toBe(9);
  });

  it("toggle flips playing; speed is stored", () => {
    expect(playerReducer(init(10), { type: "toggle" }).playing).toBe(true);
    expect(playerReducer(init(10), { type: "speed", speed: 4 }).speed).toBe(4);
  });
});
