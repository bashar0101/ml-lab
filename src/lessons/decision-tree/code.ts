import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def grow(X, y, depth=0):" },
  { text: "    if depth == max_depth or gini(y) == 0 or len(y) < 2 * min_leaf:", key: "leaf" },
  { text: "        return Leaf(majority(y))", key: "leaf" },
  { text: "    best = None" },
  { text: "    for f in (0, 1):                     # each feature", key: "scan" },
  { text: "        for t in midpoints(X[:, f]):     # each threshold", key: "scan" },
  { text: "            left = X[:, f] < t", key: "scan" },
  { text: "            if min(left.sum(), (~left).sum()) < min_leaf:", key: "scan" },
  { text: "                continue                 # a half would be too small", key: "scan" },
  { text: "            g = weighted_gini(y[left], y[~left])", key: "scan" },
  { text: "            if best is None or g < best.g:", key: "scan" },
  { text: "                best = Split(f, t, g, gain=gini(y) - g)", key: "scan" },
  { text: "    if best is None or best.gain <= 0:   # no question helps", key: "leaf" },
  { text: "        return Leaf(majority(y))", key: "leaf" },
  { text: "    left = X[:, best.f] < best.t", key: "split" },
  { text: "    return Node(best, grow(X[left], y[left], depth + 1),", key: "split" },
  { text: "                      grow(X[~left], y[~left], depth + 1))", key: "split" },
  { text: "" },
  { text: "tree = grow(X, y)   # animated level by level; same tree", key: "init" },
  { text: "print(tree)         # every point now lands in a leaf", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "start with every point in one box", key: "init" },
  { text: "for each box, level by level:" },
  { text: "    pure, too small, or deep enough? make it a leaf", key: "leaf" },
  { text: "    try every question \"feature < t?\" that keeps", key: "scan" },
  { text: "    at least min_leaf points on each side;", key: "scan" },
  { text: "    keep the one that leaves the purest halves", key: "scan" },
  { text: "    no question helps? make it a leaf", key: "leaf" },
  { text: "    otherwise split the box in two with it", key: "split" },
  { text: "done: every point lands in a leaf", key: "return" },
];
