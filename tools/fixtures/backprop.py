"""Reference numbers for the backpropagation lesson.

One gradient step on a single example for a [2, 3, 1] tanh network, and the size of the
weight gradient in every layer of a deep sigmoid network after one full-batch epoch.
Writes src/lessons/backpropagation/fixtures.json.

    python tools/fixtures/backprop.py
"""

import json
from pathlib import Path

import numpy as np

from mlp import POINTS, backward, forward, init, standardise


def grad_norms(W, b, X, Y, activation):
    g = [np.zeros_like(w) for w in W]
    for x, y in zip(X, Y):
        z, a = forward(W, b, x, activation)
        _, dW = backward(W, z, a, y, activation)
        for l in range(len(W)):
            g[l] += dW[l] / len(Y)
    return [float(np.sqrt((gl**2).sum())) for gl in g]


def main():
    X = standardise(POINTS)
    Y = [p[2] for p in POINTS]
    W, b = init([2, 3, 1], "tanh", 1)
    z, a = forward(W, b, X[0], "tanh")
    dz, dW = backward(W, z, a, Y[0], "tanh")
    W1 = [w - 0.5 * g for w, g in zip(W, dW)]
    Wd, bd = init([2, 3, 3, 3, 3, 3, 1], "sigmoid", 1)
    out = {
        "step": {"x": X[0].tolist(), "y": Y[0], "p": float(a[-1][0]), "dz": [d.tolist() for d in dz], "W_after": [w.tolist() for w in W1]},
        "deepSigmoid": grad_norms(Wd, bd, X, Y, "sigmoid"),
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "backpropagation" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}; deep sigmoid grad norms {['%.2e' % v for v in out['deepSigmoid']]}")


if __name__ == "__main__":
    main()
