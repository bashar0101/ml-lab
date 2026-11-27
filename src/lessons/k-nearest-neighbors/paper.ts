/** The "solve it by hand" data, shared by the paper example and the Lab's paper preset. */
export const PAPER_POINTS: { x1: number; x2: number; label: "good" | "bad" }[] = [
  { x1: 9, x2: 8, label: "good" },
  { x1: 7, x2: 8, label: "good" },
  { x1: 5, x2: 6, label: "bad" },
  { x1: 6, x2: 5, label: "good" },
  { x1: 8, x2: 7, label: "good" },
  { x1: 7, x2: 9, label: "good" },
  { x1: 9, x2: 7, label: "good" },
  { x1: 3, x2: 3, label: "bad" },
  { x1: 4.6, x2: 3.2, label: "bad" },
];
export const PAPER_QUERY = { x: 7, y: 6 };
export const PAPER_K = 3;
