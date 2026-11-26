import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def train_svm(X, y, C=1.0, epochs=20, kernel=linear):" },
  { text: "    Z = (X - X.mean(axis=0)) / X.std(axis=0)", key: "init" },
  { text: "    # y is +1 or -1; linear: kernel(a, b) = a @ b + 1", key: "init" },
  { text: "    n = len(y); lam = 1 / (C * n)", key: "init" },
  { text: "    K = np.array([[kernel(a, b) for b in Z] for a in Z])", key: "init" },
  { text: "    alpha, total, t = np.zeros(n), np.zeros(n), 0", key: "init" },
  { text: "    for epoch in range(epochs):" },
  { text: "        for i in shuffled(range(n)):", key: "pick" },
  { text: "            t += 1", key: "pick" },
  { text: "            f = (alpha * y) @ K[:, i] / (lam * t)", key: "pick" },
  { text: "            if y[i] * f < 1:   # inside the street or wrong", key: "update" },
  { text: "                alpha[i] += 1   # this point pushes", key: "update" },
  { text: "            total += alpha / (lam * t)", key: "update" },
  { text: "    coef = total / t   # the average over all steps", key: "return" },
  { text: "    return coef        # f(x) = Σ coef·y·K(xᵢ, x)", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "scale the features; start with no boundary", key: "init" },
  { text: "repeat for every epoch:" },
  { text: "    visit the points in a random order", key: "pick" },
  { text: "    is this point inside the street, or on", key: "pick" },
  { text: "    the wrong side? then it pushes the", key: "update" },
  { text: "    boundary away from itself (alpha += 1)", key: "update" },
  { text: "draw the boundary averaged over all steps;", key: "return" },
  { text: "the points that ever pushed are the support vectors", key: "return" },
];
