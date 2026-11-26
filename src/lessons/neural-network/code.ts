import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def train(X, y, hidden=[4], lr=0.5, epochs=300):" },
  { text: "    sizes = [2, *hidden, 1]", key: "init" },
  { text: "    W = [rng.normal(0, (1 / n) ** 0.5, (m, n))   # 2 / n for ReLU", key: "init" },
  { text: "         for n, m in zip(sizes, sizes[1:])]", key: "init" },
  { text: "    b = [np.zeros(m) for m in sizes[1:]]", key: "init" },
  { text: "    for epoch in range(epochs):" },
  { text: "        a = [X]                          # inputs", key: "input" },
  { text: "        for Wl, bl in zip(W[:-1], b[:-1]):", key: "hidden" },
  { text: "            a.append(act(a[-1] @ Wl.T + bl))   # tanh, ReLU or sigmoid", key: "hidden" },
  { text: "        p = sigmoid(a[-1] @ W[-1].T + b[-1])", key: "output" },
  { text: "        dW, db = backprop(W, a, p, y)    # lesson 11", key: "update" },
  { text: "        W = [w - lr * g for w, g in zip(W, dW)]", key: "update" },
  { text: "        b = [v - lr * g for v, g in zip(b, db)]", key: "update" },
  { text: "    return W, b", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "start with small random weights", key: "init" },
  { text: "repeat for every epoch:" },
  { text: "    feed in the two numbers of each point", key: "input" },
  { text: "    each hidden neuron: weighted sum, then squash", key: "hidden" },
  { text: "    output neuron: weighted sum → probability", key: "output" },
  { text: "    nudge every weight downhill on the loss", key: "update" },
  { text: "the trained weights are the model", key: "return" },
];
