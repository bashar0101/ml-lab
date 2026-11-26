import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def train(X, y, lr=0.5, steps=60):" },
  { text: "    Z = (X - X.mean(axis=0)) / X.std(axis=0)", key: "init" },
  { text: "    w, b = np.zeros(2), 0.0", key: "init" },
  { text: "    for step in range(steps):" },
  { text: "        p = 1 / (1 + np.exp(-(Z @ w + b)))", key: "predict" },
  { text: "        error = p - y", key: "error" },
  { text: "        w -= lr * (Z.T @ error) / len(y)", key: "update" },
  { text: "        b -= lr * error.mean()", key: "update" },
  { text: "    return w, b", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "scale both features to mean 0, spread 1", key: "init" },
  { text: "start with a flat line: w = (0, 0), b = 0", key: "init" },
  { text: "repeat steps times:" },
  { text: "    score each point: z = w·x + b,", key: "predict" },
  { text: "    squash it: p = 1 / (1 + e^(−z))", key: "predict" },
  { text: "    error = p − real class (0 or 1)", key: "error" },
  { text: "    nudge w and b against the error", key: "update" },
  { text: "return the line", key: "return" },
];
