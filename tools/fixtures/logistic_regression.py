"""Reference results for the logistic regression lesson.

Full-batch gradient descent on mean log-loss with standardised features, exactly as the
lesson's Python tab. Writes src/lessons/logistic-regression/fixtures.json.

    python tools/fixtures/logistic_regression.py
"""

import json
from pathlib import Path

import numpy as np

# Small fixed dataset shared with the TypeScript test (x, y, class).
POINTS = [
    (2.0, 3.0, 0), (3.1, 2.2, 0), (2.6, 4.4, 0), (4.0, 3.1, 0), (3.5, 5.2, 1), (1.8, 2.5, 0),
    (6.5, 6.0, 1), (7.2, 5.1, 1), (5.9, 7.3, 1), (4.8, 4.2, 0), (6.1, 4.9, 1), (8.0, 7.0, 1),
]


def train(X, y, lr=0.5, steps=60, record=()):
    Z = (X - X.mean(axis=0)) / X.std(axis=0)
    w = np.zeros(2)
    b = 0.0
    seen = {}
    for step in range(1, steps + 1):
        p = 1 / (1 + np.exp(-(Z @ w + b)))
        error = p - y
        w -= lr * (Z.T @ error) / len(y)
        b -= lr * error.mean()
        if step in record:
            p2 = np.clip(1 / (1 + np.exp(-(Z @ w + b))), 1e-12, 1 - 1e-12)
            loss = -np.mean(y * np.log(p2) + (1 - y) * np.log(1 - p2))
            seen[step] = {"w": w.tolist(), "b": float(b), "loss": float(loss)}
    return seen


def main():
    X = np.array([[p[0], p[1]] for p in POINTS], dtype=float)
    y = np.array([p[2] for p in POINTS], dtype=float)
    out = {"points": POINTS, "steps": train(X, y, record=(1, 10, 60))}
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "logistic-regression" / "fixtures.json"
    target.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
