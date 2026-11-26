"""Reference multilayer perceptron for the neural network and backpropagation lessons.

Weights: N(0, 1/fan_in) (tanh, sigmoid) or N(0, 2/fan_in) (relu) from mulberry32 + Box–Muller,
row by row (neuron j, then input i); biases 0. Output: one sigmoid unit, log-loss.
Writes src/lessons/neural-network/fixtures.json.

    python tools/fixtures/mlp.py
"""

import json
import math
from pathlib import Path

import numpy as np

from mulberry32 import mulberry32

POINTS = [
    (2.0, 3.0, 0), (3.1, 2.2, 0), (2.6, 4.4, 0), (4.0, 3.1, 0), (3.5, 5.2, 1), (1.8, 2.5, 0),
    (6.5, 6.0, 1), (7.2, 5.1, 1), (5.9, 7.3, 1), (4.8, 4.2, 0), (6.1, 4.9, 1), (8.0, 7.0, 1),
]

ACT = {
    "tanh": (np.tanh, lambda z: 1 - np.tanh(z) ** 2),
    "relu": (lambda z: np.maximum(z, 0), lambda z: (z > 0).astype(float)),
    "sigmoid": (lambda z: 1 / (1 + np.exp(-z)), lambda z: (1 / (1 + np.exp(-z))) * (1 - 1 / (1 + np.exp(-z)))),
}


def init(sizes, activation, seed):
    rand = mulberry32(seed)

    def gauss():
        u = max(rand(), 1e-12)
        v = rand()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)

    W, b = [], []
    for l in range(len(sizes) - 1):
        fan_in = sizes[l]
        std = math.sqrt((2.0 if activation == "relu" else 1.0) / fan_in)
        W.append(np.array([[gauss() * std for _ in range(fan_in)] for _ in range(sizes[l + 1])]))
        b.append(np.zeros(sizes[l + 1]))
    return W, b


def forward(W, b, x, activation):
    f, _ = ACT[activation]
    a = [np.array(x, dtype=float)]
    z = []
    for l in range(len(W)):
        zl = W[l] @ a[-1] + b[l]
        z.append(zl)
        a.append(1 / (1 + np.exp(-zl)) if l == len(W) - 1 else f(zl))
    return z, a


def backward(W, z, a, y, activation):
    _, df = ACT[activation]
    L = len(W)
    dz = [None] * L
    dz[L - 1] = a[L] - y
    for l in range(L - 2, -1, -1):
        dz[l] = (W[l + 1].T @ dz[l + 1]) * df(z[l])
    dW = [np.outer(dz[l], a[l]) for l in range(L)]
    return dz, dW


def standardise(points):
    X = np.array([p[:2] for p in points], dtype=float)
    return (X - X.mean(axis=0)) / X.std(axis=0)


def train(W, b, X, Y, lr, epochs, activation):
    for _ in range(epochs):
        gW = [np.zeros_like(w) for w in W]
        gb = [np.zeros_like(v) for v in b]
        for x, y in zip(X, Y):
            z, a = forward(W, b, x, activation)
            dz, dW = backward(W, z, a, y, activation)
            for l in range(len(W)):
                gW[l] += dW[l] / len(Y)
                gb[l] += dz[l] / len(Y)
        W = [w - lr * g for w, g in zip(W, gW)]
        b = [v - lr * g for v, g in zip(b, gb)]
    return W, b


def tolist(arrs):
    return [a.tolist() for a in arrs]


def main():
    X = standardise(POINTS)
    Y = [p[2] for p in POINTS]
    W1, b1 = init([2, 3, 1], "tanh", 1)
    z, a = forward(W1, b1, X[0], "tanh")
    dz, dW = backward(W1, z, a, Y[0], "tanh")
    Wt, bt = train(W1, b1, X, Y, 0.5, 20, "tanh")
    W2, _ = init([2, 4, 4, 1], "relu", 2)
    out = {
        "points": POINTS,
        "tanh": {"W": tolist(W1), "a": tolist(a), "dz": tolist(dz), "dW": tolist(dW), "after20": {"W": tolist(Wt), "b": tolist(bt)}},
        "relu": {"W": tolist(W2)},
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "neural-network" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
