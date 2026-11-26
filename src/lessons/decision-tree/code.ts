import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def grow(X, y, depth=0):" },
  { text: "    if depth == max_depth or gini(y) == 0:", key: "leaf" },
  { text: "        return Leaf(majority(y))", key: "leaf" },
  { text: "    best = None" },
  { text: "    for f in (0, 1):                     # each feature", key: "scan" },
  { text: "        for t in midpoints(X[:, f]):     # each threshold", key: "scan" },
  { text: "            left = X[:, f] < t", key: "scan" },
  { text: "            g = weighted_gini(y[left], y[~left])", key: "scan" },
  { text: "            if best is None or g < best.g:", key: "scan" },
  { text: "                best = Split(f, t, g)", key: "scan" },
  { text: "    left = X[:, best.f] < best.t", key: "split" },
  { text: "    return Node(best, grow(X[left], y[left], depth + 1),", key: "split" },
  { text: "                      grow(X[~left], y[~left], depth + 1))", key: "split" },
  { text: "" },
  { text: "tree = grow(X, y)   # animated level by level; same tree", key: "init" },
  { text: "", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "start with every point in one box", key: "init" },
  { text: "for each box, level by level:" },
  { text: "    pure, or deep enough? make it a leaf", key: "leaf" },
  { text: "    try every question \"feature < t?\"", key: "scan" },
  { text: "    keep the one that leaves the purest halves", key: "scan" },
  { text: "    split the box in two with that question", key: "split" },
  { text: "done: every point lands in a leaf", key: "return" },
];
