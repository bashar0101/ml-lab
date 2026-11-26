import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def kmeans(X, k=3, max_iter=20):" },
  { text: "    centres = X[rng.permutation(len(X))[:k]]   # random start", key: "init" },
  { text: "    # or k-means++: pick each next centre far from the others", key: "init" },
  { text: "    assign = None" },
  { text: "    for _ in range(max_iter):" },
  { text: "        d = ((X[:, None] - centres) ** 2).sum(axis=2)", key: "assign" },
  { text: "        new = d.argmin(axis=1)   # nearest centre", key: "assign" },
  { text: "        if assign is not None and (new == assign).all():", key: "return" },
  { text: "            break                # nobody moved: done", key: "return" },
  { text: "        assign = new" },
  { text: "        for j in range(k):" },
  { text: "            if (assign == j).any():   # empty: keep it", key: "update" },
  { text: "                centres[j] = X[assign == j].mean(axis=0)", key: "update" },
  { text: "    return centres, assign", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "drop k centres onto the map", key: "init" },
  { text: "    (random points, or k-means++: far apart)", key: "init" },
  { text: "repeat:" },
  { text: "    each point joins its nearest centre", key: "assign" },
  { text: "    each centre moves to the middle of its points", key: "update" },
  { text: "until no point changes its centre", key: "return" },
];
