import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def knn_predict(X, y, query, k=5):" },
  { text: "    # query = the new point we want a class for", key: "init" },
  { text: "    d = np.sqrt(((X - query) ** 2).sum(axis=1))", key: "measure" },
  { text: "    # manhattan: d = np.abs(X - query).sum(axis=1)", key: "measure" },
  { text: '    nearest = np.argsort(d, kind="stable")[:k]', key: "sort" },
  { text: "    votes = np.bincount(y[nearest])", key: "vote" },
  { text: "    top = votes.max()", key: "decide" },
  { text: "    for i in nearest:  # a tie: the closest point decides", key: "decide" },
  { text: "        if votes[y[i]] == top:", key: "decide" },
  { text: "            return y[i]", key: "decide" },
  { text: "" },
  { text: "# the coloured map: ask the same question everywhere", key: "map" },
  { text: "grid_classes = [knn_predict(X, y, p) for p in grid]", key: "map" },
];

export const pseudo: CodeLine[] = [
  { text: "a new point arrives", key: "init" },
  { text: "measure its distance to every known point", key: "measure" },
  { text: "sort by distance, keep the k closest", key: "sort" },
  { text: "count the classes among those k", key: "vote" },
  { text: "answer the class with the most votes", key: "decide" },
  { text: "    (a tie: the closest point decides)", key: "decide" },
  { text: "do the same for every spot on the map", key: "map" },
];
