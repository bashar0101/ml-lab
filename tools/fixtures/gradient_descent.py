"""Reference results for the gradient descent lesson.

Runs plain, momentum and Adam on every surface (each surface's suggested learning rate,
40 steps) and writes src/lessons/gradient-descent/fixtures.json.

    python tools/fixtures/gradient_descent.py
"""

import json
from pathlib import Path

import numpy as np

SURFACES = {
    "bowl": (lambda x, y: x * x + y * y, lambda x, y: (2 * x, 2 * y), (-2.4, 2.0), 0.1),
    "ravine": (lambda x, y: 0.5 * x * x + 5 * y * y, lambda x, y: (x, 10 * y), (-2.6, 1.2), 0.18),
    "saddle": (lambda x, y: x * x - y * y + 0.25 * y**4, lambda x, y: (2 * x, -2 * y + y**3), (-2.5, 0.05), 0.1),
    "two-valleys": (lambda x, y: (x * x - 1) ** 2 + 0.4 * x + y * y, lambda x, y: (4 * x * (x * x - 1) + 0.4, 2 * y), (2.0, 1.5), 0.05),
    # The "solve it by hand" loss (w - 3)^2 along x; y only adds a bowl so the picture has two axes.
    "paper": (lambda x, y: (x - 3) ** 2 + y * y, lambda x, y: (2 * (x - 3), 2 * y), (0.0, 0.0), 0.25),
}


def descend(grad, start, lr, steps, method, record):
    """The lesson's loop: plain, momentum (beta 0.9) or Adam (0.9, 0.999, 1e-8)."""
    x = np.array(start, dtype=float)
    v = np.zeros(2)
    m = np.zeros(2)
    s = np.zeros(2)
    seen = {}
    for t in range(1, steps + 1):
        g = np.array(grad(*x))
        if method == "plain":
            x = x - lr * g
        elif method == "momentum":
            v = 0.9 * v + g
            x = x - lr * v
        else:
            m = 0.9 * m + 0.1 * g
            s = 0.999 * s + 0.001 * g**2
            x = x - lr * (m / (1 - 0.9**t)) / (np.sqrt(s / (1 - 0.999**t)) + 1e-8)
        if t in record:
            seen[t] = [float(x[0]), float(x[1])]
    return seen


def main():
    out = {}
    for name, (_f, grad, start, lr) in SURFACES.items():
        out[name] = {m: descend(grad, start, lr, 40, m, (1, 10, 40)) for m in ("plain", "momentum", "adam")}
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "gradient-descent" / "fixtures.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
