import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def random_forest(X, y, n_trees=15, max_depth=4):" },
  { text: "    trees = []", key: "init" },
  { text: "    for _ in range(n_trees):" },
  { text: "        rows = rng.integers(0, len(y), len(y))  # bootstrap", key: "sample" },
  { text: "        tree = grow(X[rows], y[rows], max_depth,", key: "grow" },
  { text: "                    features=lambda: [rng.choice([0, 1])])", key: "grow" },
  { text: "        trees.append(tree)", key: "vote" },
  { text: "    return trees", key: "return" },
  { text: "" },
  { text: "def predict(trees, x):" },
  { text: "    votes = [tree.predict(x) for tree in trees]", key: "vote" },
  { text: "    return majority(votes)", key: "vote" },
];

export const pseudo: CodeLine[] = [
  { text: "start with an empty forest", key: "init" },
  { text: "repeat for each tree:" },
  { text: "    draw a random sample of the points,", key: "sample" },
  { text: "    with repeats (some appear twice, some never)", key: "sample" },
  { text: "    grow a tree on it, asking each question", key: "grow" },
  { text: "    about one randomly chosen feature", key: "grow" },
  { text: "    add it to the forest; the forest votes", key: "vote" },
  { text: "answer = the most common vote", key: "return" },
];
