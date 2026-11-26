import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def train_svm(X, y, C=1.0, epochs=20, kernel=linear):" },
  { text: "    # y is +1 or -1; K = kernel between every pair", key: "init" },
  { text: "    n = len(y); lam = 1 / (C * n)", key: "init" },
  { text: "    K = np.array([[kernel(a, b) for b in X] for a in X])", key: "init" },
  { text: "    alpha = np.zeros(n); t = 0", key: "init" },
  { text: "    for epoch in range(epochs):" },
  { text: "        for i in shuffled(range(n)):", key: "pick" },
  { text: "            t += 1", key: "pick" },
  { text: "            f = (alpha * y) @ K[:, i] / (lam * t)", key: "pick" },
  { text: "            if y[i] * f < 1:   # inside the street or wrong", key: "update" },
  { text: "                alpha[i] += 1   # this point pushes", key: "update" },
  { text: "    return alpha   # f(x) = Σ alpha·y·K(xᵢ, x) / (lam·t)", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "start with no boundary at all", key: "init" },
  { text: "repeat for every epoch:" },
  { text: "    visit the points in a random order", key: "pick" },
  { text: "    is this point inside the street, or on", key: "pick" },
  { text: "    the wrong side? then it pushes the", key: "update" },
  { text: "    boundary away from itself (alpha += 1)", key: "update" },
  { text: "the points that pushed are the support vectors", key: "return" },
];
