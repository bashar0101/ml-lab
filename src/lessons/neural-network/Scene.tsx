"use client";

import { useMemo } from "react";
import { useT } from "@/i18n/ui-context";
import type { ClassData } from "../shared/ClassDataControls";
import { forward, predict, type Mlp } from "../shared/mlp";
import { ClassMarker, makeScale, Plot2D } from "../shared/Plot2D";
import { regionGrid } from "../shared/regions";
import type { SceneProps } from "../types";
import type { NetState } from "./algorithm";
import styles from "./Scene.module.css";

export type NetData = ClassData;

const W = 780;
const H = 395;
const PLOT = { x0: 50, y0: 34, x1: 366, y1: 350 };
const NET = { x0: 440, x1: 760, y0: 46, y1: 350 };
const DOMAIN: [number, number] = [0, 10];
const BANDS = 8;
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Activation → one of seven colour bands (negative peach … positive lavender). */
function band(v: number, output: boolean): number {
  const t = output ? v * 2 - 1 : Math.tanh(v);
  return Math.max(0, Math.min(6, Math.round((t + 1) * 3)));
}

export function NetworkDiagram({
  net,
  activations,
  shownLayers,
  showValues,
  box = NET,
}: {
  net: Mlp;
  activations: number[][] | null;
  shownLayers: number;
  showValues: boolean;
  box?: { x0: number; x1: number; y0: number; y1: number };
}) {
  const cols = net.sizes.length;
  const pos = (l: number, j: number) => {
    const x = box.x0 + ((box.x1 - box.x0) * (l + 0.5)) / cols;
    const n = net.sizes[l];
    const gap = Math.min(54, (box.y1 - box.y0) / Math.max(1, n));
    const y = (box.y0 + box.y1) / 2 + (j - (n - 1) / 2) * gap;
    return { x, y };
  };
  const r = Math.min(15, (box.y1 - box.y0) / Math.max(...net.sizes) / 2.6);
  return (
    <g>
      {net.W.map((layer, l) =>
        layer.map((row, j) =>
          row.map((w, i) => {
            const a = pos(l, i);
            const b = pos(l + 1, j);
            return (
              <line
                key={`${l}-${j}-${i}`}
                data-part="edge"
                className={w >= 0 ? styles.edgePos : styles.edgeNeg}
                strokeWidth={0.6 + 3.2 * Math.min(1, Math.abs(w) / 2)}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
              />
            );
          }),
        ),
      )}
      {net.sizes.map((n, l) =>
        Array.from({ length: n }, (_, j) => {
          const { x, y } = pos(l, j);
          const known = activations && l < shownLayers;
          const v = known ? activations![l][j] : null;
          return (
            <g key={`${l}-${j}`}>
              <circle data-part="node" className={v === null ? styles.nodeEmpty : styles[`n${band(v, l === net.sizes.length - 1)}`]} cx={x} cy={y} r={r} />
              {showValues && v !== null && r >= 9 && (
                <text data-part="node-value" className={styles.nodeValue} x={x} y={y + 3.5} textAnchor="middle">
                  {v.toFixed(2)}
                </text>
              )}
              {showValues && v !== null && r < 9 && <title data-part="node-value">{v.toFixed(2)}</title>}
            </g>
          );
        }),
      )}
    </g>
  );
}

export function Scene({ trace, index, data, reveal, onData, stale }: SceneProps<NetState, NetData>) {
  const t = useT();
  const show = (part: string) => (!stale || part === "points") && (reveal === "all" || reveal.has(part));
  const frame = trace.frames[Math.max(0, Math.min(trace.frames.length - 1, index))];
  const s = frame.state;
  const pts = data.points;
  const sc = makeScale(PLOT, DOMAIN, DOMAIN);
  const editable = !!onData && data.presetId === "custom";
  const z = (x: number, y: number) => [(x - s.mean[0]) / s.std[0], (y - s.mean[1]) / s.std[1]];
  const probe = pts[s.probe];
  const forwardFrame = s.layer !== null;
  const activations = probe ? forward(s.net, z(probe.x, probe.y)).a : null;
  const shown = forwardFrame ? s.layer! + 1 : s.net.sizes.length;

  const shade = useMemo(() => regionGrid((x, y) => predict(s.net, z(x, y)), DOMAIN, DOMAIN, 28), [s.net]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t("nn.scene.label")}>
      {show("shade") && (
        <g data-part="shade" pointerEvents="none">
          {shade.cells.map((c, k) => (
            <rect
              key={k}
              className={styles[`p${Math.min(BANDS - 1, Math.floor(c.v * BANDS))}`]}
              x={sc.sx(c.x - shade.size[0] / 2)}
              y={sc.sy(c.y + shade.size[1] / 2)}
              width={sc.sx(shade.size[0]) - sc.sx(0) + 0.6}
              height={sc.sy(0) - sc.sy(shade.size[1]) + 0.6}
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
        {() => null}
      </Plot2D>
      {show("points") &&
        pts.map((p, i) => (
          <ClassMarker key={i} x={sc.sx(p.x)} y={sc.sy(p.y)} c={p.c} r={5} onClick={editable ? () => onData!({ ...data, points: pts.filter((_, k) => k !== i) }) : undefined} />
        ))}
      {show("probe") && probe && forwardFrame && (
        <circle data-part="probe" className={styles.probe} cx={sc.sx(probe.x)} cy={sc.sy(probe.y)} r={11} pointerEvents="none" />
      )}
      {show("network") && (
        <g>
          <text className={styles.caption} x={(NET.x0 + NET.x1) / 2} y={24} textAnchor="middle">
            {t("nn.scene.network")}
          </text>
          <NetworkDiagram net={s.net} activations={show("values") ? activations : null} shownLayers={shown} showValues={show("values")} />
        </g>
      )}
    </svg>
  );
}
