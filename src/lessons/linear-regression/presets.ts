import type { Point } from "./algorithm";

export type PresetId = "study-hours" | "house-prices" | "outlier";

export interface Preset {
  id: PresetId;
  points: Point[];
  /** ui.json keys for the axis labels. */
  xLabelKey: string;
  yLabelKey: string;
}

const STUDY: Point[] = [42, 48, 50, 61, 63, 70, 72, 83, 85].map((y, i) => ({ x: i + 1, y }));

export const PRESETS: Preset[] = [
  { id: "study-hours", points: STUDY, xLabelKey: "lr.axis.hours", yLabelKey: "lr.axis.score" },
  {
    id: "house-prices",
    points: [
      [50, 150],
      [60, 180],
      [70, 195],
      [80, 230],
      [90, 240],
      [100, 275],
      [110, 290],
      [120, 330],
      [130, 345],
      [140, 370],
    ].map(([x, y]) => ({ x, y })),
    xLabelKey: "lr.axis.size",
    yLabelKey: "lr.axis.price",
  },
  {
    id: "outlier",
    points: [...STUDY, { x: 8.5, y: 15 }],
    xLabelKey: "lr.axis.hours",
    yLabelKey: "lr.axis.score",
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
