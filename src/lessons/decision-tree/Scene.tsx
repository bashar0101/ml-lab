"use client";

import { useT } from "@/i18n/ui-context";
import type { TreeNode } from "../shared/cart";
import type { ClassData } from "../shared/ClassDataControls";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import type { SceneProps } from "../types";
import type { TreeState } from "./algorithm";
import styles from "./Scene.module.css";

export type TreeData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const TREE = { x0: 410, x1: 772, y0: 40, y1: 372 };
const DOMAIN: [number, number] = [0, 10];
const round1 = (v: number) => Math.round(v * 10) / 10;

/** In-order leaf positions; parents sit midway over their children. */
function layout(nodes: TreeNode[]) {
  const pos = new Map<number, { col: number; depth: number }>();
  let leaf = 0;
  const visit = (id: number): number => {
    const n = nodes[id];
    if (n.left === undefined || n.right === undefined || !nodes[n.left] || !nodes[n.right]) {
      pos.set(id, { col: leaf, depth: n.depth });
      return leaf++;
    }
    const col = (visit(n.left) + visit(n.right)) / 2;
    pos.set(id, { col, depth: n.depth });
    return col;
  };
  visit(0);
  return { pos, leaves: leaf, depth: Math.max(...nodes.map((n) => n.depth)) };
}

export function Scene({ trace, index, data, reveal, onData }: SceneProps<TreeState, TreeData>) {
  const t = useT();
  const show = (part: string) => reveal === "all" || reveal.has(part);
  const s = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))].state;
  const nodes = s.nodes;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const pts = data.points;
  const editable = !!onData && data.presetId === "custom";
  const current = s.current !== null ? nodes[s.current] : null;
  const feature = (f: 0 | 1) => t(`dt.feature.${f}`);

  const lay = layout(nodes);
  const cell = (TREE.x1 - TREE.x0) / Math.max(1, lay.leaves);
  const row = Math.min(62, (TREE.y1 - TREE.y0 - 26) / Math.max(1, lay.depth));
  const nw = Math.max(8, Math.min(70, cell - 4));
  const nh = 26;
  const at = (id: number) => {
    const p = lay.pos.get(id)!;
    return { x: TREE.x0 + (p.col + 0.5) * cell, y: TREE.y0 + p.depth * row + nh / 2 };
  };
  const wide = nw >= 46;

  const lineOf = (n: TreeNode) =>
    n.split!.feature === 0
      ? { x1: sc.sx(n.split!.threshold), x2: sc.sx(n.split!.threshold), y1: sc.sy(n.box.y[0]), y2: sc.sy(n.box.y[1]) }
      : { x1: sc.sx(n.box.x[0]), x2: sc.sx(n.box.x[1]), y1: sc.sy(n.split!.threshold), y2: sc.sy(n.split!.threshold) };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("dt.scene.label")}>
      {show("regions") && (
        <g pointerEvents="none">
          {nodes
            .filter((n) => !n.split)
            .map((n) => (
              <rect
                key={n.id}
                data-part="region"
                className={styles[`m${n.prediction}`]}
                x={sc.sx(n.box.x[0])}
                y={sc.sy(n.box.y[1])}
                width={sc.sx(n.box.x[1]) - sc.sx(n.box.x[0])}
                height={sc.sy(n.box.y[0]) - sc.sy(n.box.y[1])}
              />
            ))}
        </g>
      )}
      <Plot2D
        box={PLOT}
        x={DOMAIN}
        y={DOMAIN}
        xLabel={t("dt.feature.0")}
        yLabel={t("dt.feature.1")}
        onPlotClick={editable ? (p) => onData!({ ...data, points: [...pts, { x: round1(p.x), y: round1(p.y), c: data.drawClass }] }) : undefined}
      >
        {() => (
          <g pointerEvents="none">
            {current && (
              <rect
                className={styles.currentBox}
                x={sc.sx(current.box.x[0])}
                y={sc.sy(current.box.y[1])}
                width={sc.sx(current.box.x[1]) - sc.sx(current.box.x[0])}
                height={sc.sy(current.box.y[0]) - sc.sy(current.box.y[1])}
              />
            )}
            {show("splits") &&
              nodes.filter((n) => n.split).map((n) => <line key={n.id} data-part="split-line" className={styles.split} {...lineOf(n)} />)}
            {show("candidates") &&
              current &&
              s.candidates.map((c) => {
                const l = lineOf({ ...current, split: c });
                return (
                  <g key={c.feature} data-part="candidate">
                    <line className={styles.candidate} {...l} />
                    <text className={styles.candidateLabel} x={(l.x1 + l.x2) / 2 + 4} y={Math.min(l.y1, l.y2) + 14 + c.feature * 12}>
                      {t("dt.scene.candidate", { feature: feature(c.feature), t: round1(c.threshold), gini: c.gini.toFixed(2) })}
                    </text>
                  </g>
                );
              })}
          </g>
        )}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => (
          <ClassMarker
            key={i}
            x={sc.sx(p.x)}
            y={sc.sy(p.y)}
            c={p.c}
            r={5}
            onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined}
          />
        ))}

      {show("tree") && (
        <g>
          <text className={styles.caption} x={(TREE.x0 + TREE.x1) / 2} y={22} textAnchor="middle">
            {t("dt.scene.tree")}
          </text>
          {nodes.map((n) =>
            n.left !== undefined && n.right !== undefined && nodes[n.left] && nodes[n.right]
              ? [n.left, n.right].map((c, k) => {
                  const a = at(n.id);
                  const b = at(c);
                  return (
                    <g key={`${n.id}-${c}`}>
                      <line className={styles.edge} x1={a.x} y1={a.y + nh / 2} x2={b.x} y2={b.y - nh / 2} />
                      {wide && (
                        <text className={styles.edgeLabel} x={(a.x + b.x) / 2 + (k ? 6 : -6)} y={(a.y + b.y) / 2} textAnchor={k ? "start" : "end"}>
                          {t(k ? "dt.scene.no" : "dt.scene.yes")}
                        </text>
                      )}
                    </g>
                  );
                })
              : null,
          )}
          {nodes.map((n) => {
            const { x, y } = at(n.id);
            const total = n.counts.reduce((a, c) => a + c, 0) || 1;
            let offset = 0;
            return (
              <g key={n.id} data-part="tree-node" className={n.id === s.current ? styles.active : undefined}>
                <rect className={n.split ? styles.node : styles[`leaf${n.prediction}`]} x={x - nw / 2} y={y - nh / 2} width={nw} height={nh} rx={5} />
                {/* class mix of the points that reach this node */}
                {n.counts.map((c, k) => {
                  const w = ((nw - 6) * c) / total;
                  const el = c ? <rect key={k} className={styles[`bar${k}`]} x={x - nw / 2 + 3 + offset} y={y + nh / 2 - 7} width={w} height={4} /> : null;
                  offset += w;
                  return el;
                })}
                {wide && (
                  <text className={styles.nodeText} x={x} y={y + 1} textAnchor="middle">
                    {n.split
                      ? t("dt.scene.rule", { feature: feature(n.split.feature), t: round1(n.split.threshold) })
                      : t("dt.scene.leaf", { n: n.indices.length })}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
