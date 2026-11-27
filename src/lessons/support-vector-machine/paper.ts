/**
 * The "solve it by hand" data, shared by the paper example and the Lab's paper preset.
 * x and y take the same values, so the Lab's per-feature scaling keeps the paper's geometry:
 * the trained line lands close to the paper's w = (1, 1), b = −5.
 */
export const PAPER_POINTS: { x: [number, number]; y: 1 | -1 }[] = [
  { x: [3, 3], y: 1 },
  { x: [4, 3], y: 1 },
  { x: [3, 4], y: 1 },
  { x: [2, 2], y: -1 },
  { x: [1, 2], y: -1 },
  { x: [2, 1], y: -1 },
];
export const PAPER_W: [number, number] = [1, 1];
export const PAPER_B = -5;
