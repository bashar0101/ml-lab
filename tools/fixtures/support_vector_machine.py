"""Reference results for the support vector machine lesson.

Kernel Pegasos (Shalev-Shwartz et al.) exactly as the lesson's Python tab, with the same
mulberry32 shuffle as the TypeScript code. Writes src/lessons/support-vector-machine/fixtures.json.

    python tools/fixtures/support_vector_machine.py
"""

import json
import math
from pathlib import Path

import numpy as np

from mulberry32 import mulberry32, shuffled

LINEAR_POINTS = [
    (2.0, 3.0, 0), (3.1, 2.2, 0), (2.6, 4.4, 0), (4.0, 3.1, 0), (3.5, 5.2, 1), (1.8, 2.5, 0),
    (6.5, 6.0, 1), (7.2, 5.1, 1), (5.9, 7.3, 1), (4.8, 4.2, 0), (6.1, 4.9, 1), (8.0, 7.0, 1),
]
# Inner points (class 1) inside a ring of class 0.
RING_POINTS = [(5 + r * math.cos(a), 5 + r * math.sin(a), c)
               for r, c, n in ((0.8, 1, 6), (3.4, 0, 10)) for a in [2 * math.pi * k / n + 0.3 * c for k in range(n)]]
RING_POINTS = [(round(x, 4), round(y, 4), c) for x, y, c in RING_POINTS]


def kernel(a, b, kind, gamma):
    if kind == "linear":
        return float(a @ b) + 1.0
    return math.exp(-gamma * float(((a - b) ** 2).sum())) + 1.0


def train(points, C, kind, gamma, epochs, seed=1, record=()):
    X = np.array([p[:2] for p in points], dtype=float)
    Z = (X - X.mean(axis=0)) / X.std(axis=0)
    y = np.array([1.0 if p[2] == 1 else -1.0 for p in points])
    n = len(y)
    lam = 1.0 / (C * n)
    K = np.array([[kernel(Z[i], Z[j], kind, gamma) for j in range(n)] for i in range(n)])
    alpha = np.zeros(n)
    rand = mulberry32(seed)
    t = 0
    seen = {}
    for epoch in range(1, epochs + 1):
        for i in shuffled(n, rand):
            t += 1
            f = (alpha * y) @ K[:, i] / (lam * t)
            if y[i] * f < 1:
                alpha[i] += 1
        if epoch in record:
            seen[epoch] = {"alpha": alpha.tolist(), "t": t}
    return seen


def main():
    out = {
        "linear": {"points": LINEAR_POINTS, "C": 1.0, "epochs": train(LINEAR_POINTS, 1.0, "linear", 0.5, 20, record=(1, 5, 20))},
        "rbf": {"points": RING_POINTS, "C": 10.0, "gamma": 0.5, "epochs": train(RING_POINTS, 10.0, "rbf", 0.5, 20, record=(1, 5, 20))},
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "support-vector-machine" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
