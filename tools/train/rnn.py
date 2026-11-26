"""Train the tiny recurrent network for the RNN lesson.

Task: read a string one letter at a time and answer, at the end, "did it start with a?".
The first letter is a or b; every later letter is c–h (noise to remember through).
Network: one-hot input (8 letters) → tanh RNN with 6 hidden units → sigmoid output.
Trained with backpropagation through time on lengths 2–12; NumPy only, fixed seed.
Writes src/lessons/recurrent-neural-network/{weights,fixtures}.json.

    python tools/train/rnn.py
"""

import json
from pathlib import Path

import numpy as np

LETTERS = "abcdefgh"
H = 6


def batch(rng, n, length):
    first = rng.integers(0, 2, n)                       # 0 = a, 1 = b
    rest = rng.integers(2, 8, (n, length - 1))
    seq = np.concatenate([first[:, None], rest], axis=1)
    return seq, (first == 0).astype(float)


def forward(p, seq):
    Wx, Wh, b, v, c = p
    n, T = seq.shape
    hs = [np.zeros((n, H))]
    for t in range(T):
        x = np.eye(8)[seq[:, t]]
        hs.append(np.tanh(x @ Wx.T + hs[-1] @ Wh.T + b))
    prob = 1 / (1 + np.exp(-(hs[-1] @ v + c)))
    return hs, prob


def grads(p, seq, y):
    Wx, Wh, b, v, c = p
    hs, prob = forward(p, seq)
    n, T = seq.shape
    d_out = (prob - y) / n
    dv = hs[-1].T @ d_out
    dc = d_out.sum()
    dh = np.outer(d_out, v)
    dWx = np.zeros_like(Wx)
    dWh = np.zeros_like(Wh)
    db = np.zeros_like(b)
    for t in range(T - 1, -1, -1):
        dz = dh * (1 - hs[t + 1] ** 2)
        x = np.eye(8)[seq[:, t]]
        dWx += dz.T @ x
        dWh += dz.T @ hs[t]
        db += dz.sum(axis=0)
        dh = dz @ Wh
    return [dWx, dWh, db, dv, dc]


def main():
    rng = np.random.default_rng(3)
    p = [rng.normal(0, 0.5, (H, 8)), rng.normal(0, 0.3, (H, H)), np.zeros(H), rng.normal(0, 0.5, H), 0.0]
    m = [np.zeros_like(np.asarray(q, dtype=float)) for q in p]
    s = [np.zeros_like(np.asarray(q, dtype=float)) for q in p]
    for step in range(1, 3001):
        seq, y = batch(rng, 64, int(rng.integers(2, 13)))
        g = grads(p, seq, y)
        for k in range(5):
            m[k] = 0.9 * m[k] + 0.1 * g[k]
            s[k] = 0.999 * s[k] + 0.001 * np.square(g[k])
            p[k] = p[k] - 0.01 * (m[k] / (1 - 0.9**step)) / (np.sqrt(s[k] / (1 - 0.999**step)) + 1e-8)
    Wx, Wh, b, v, c = [np.round(np.asarray(q, dtype=float), 6) for q in p]
    rp = [Wx, Wh, b, v, float(c)]
    eval_rng = np.random.default_rng(99)
    by_length = {}
    for L in (2, 4, 6, 8, 10, 12, 16, 20, 25, 30, 35, 40):
        seq, y = batch(eval_rng, 2000, L)
        by_length[L] = float(((forward(rp, seq)[1] >= 0.5) == (y == 1)).mean())
    out = Path(__file__).resolve().parents[2] / "src" / "lessons" / "recurrent-neural-network"
    (out / "weights.json").write_text(json.dumps({"Wx": Wx.tolist(), "Wh": Wh.tolist(), "b": b.tolist(), "v": v.tolist(), "c": float(c)}) + "\n", encoding="utf-8")
    sample = np.array([[LETTERS.index(ch) for ch in "acdhegf"]])
    hs, prob = forward(rp, sample)
    fixtures = {"sample": "acdhegf", "hidden": [h[0].tolist() for h in hs], "prob": float(prob[0]), "accuracyByLength": by_length}
    (out / "fixtures.json").write_text(json.dumps(fixtures, indent=1) + "\n", encoding="utf-8")
    print("accuracy by length", by_length)


if __name__ == "__main__":
    main()
