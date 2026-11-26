"""Train the tiny CNN for the convolutional neural network lesson.

Data: 8×8 digits drawn from a hand-made 5×7 font, shifted to a random spot and sprinkled
with pixel noise (no downloaded dataset). Network: 4 conv filters 3×3 (valid) → ReLU →
2×2 max-pool → dense 36 → 10 → softmax. Adam, fixed seed, NumPy only.
Writes src/lessons/convolutional-neural-network/{weights,fixtures}.json.

    python tools/train/digits.py
"""

import json
from pathlib import Path

import numpy as np

FONT = {
    0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
    7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
}


def glyph(d):
    return np.array([[int(c) for c in row] for row in FONT[d]], dtype=float)


def draw(d, ox, oy, rng=None, noise=0.0):
    img = np.zeros((8, 8))
    img[oy:oy + 7, ox:ox + 5] = glyph(d)
    if rng is not None and noise > 0:
        flips = rng.random((8, 8)) < noise
        img = np.where(flips, 1 - img, img)
    return img


def make(n, rng, noise=0.04):
    X = np.zeros((n, 8, 8))
    Y = rng.integers(0, 10, n)
    for i in range(n):
        X[i] = draw(int(Y[i]), int(rng.integers(0, 4)), int(rng.integers(0, 2)), rng, noise)
    return X, Y


def patches(X):
    # (N, 6, 6, 9): every 3×3 window
    N = X.shape[0]
    out = np.zeros((N, 6, 6, 9))
    for r in range(6):
        for c in range(6):
            out[:, r, c, :] = X[:, r:r + 3, c:c + 3].reshape(N, 9)
    return out


def forward(params, X):
    K, kb, W, b = params
    P = patches(X)                                    # N,6,6,9
    conv = np.einsum("nrcp,fp->nfrc", P, K.reshape(4, 9)) + kb[None, :, None, None]
    relu = np.maximum(conv, 0)
    pooled = relu.reshape(-1, 4, 3, 2, 3, 2).max(axis=(3, 5))   # N,4,3,3
    flat = pooled.reshape(-1, 36)
    logits = flat @ W.T + b
    logits -= logits.max(axis=1, keepdims=True)
    probs = np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)
    return P, conv, relu, pooled, flat, probs


def grads(params, X, Y):
    K, kb, W, b = params
    P, conv, relu, pooled, flat, probs = forward(params, X)
    N = X.shape[0]
    d_logits = probs.copy()
    d_logits[np.arange(N), Y] -= 1
    d_logits /= N
    dW = d_logits.T @ flat
    db = d_logits.sum(axis=0)
    d_pooled = (d_logits @ W).reshape(N, 4, 3, 3)
    # max-pool backward: route to the argmax of each 2×2 window
    r6 = relu.reshape(N, 4, 3, 2, 3, 2)
    mask = r6 == pooled[:, :, :, None, :, None]
    mask = mask / np.maximum(mask.sum(axis=(3, 5), keepdims=True), 1)
    d_relu = (mask * d_pooled[:, :, :, None, :, None]).reshape(N, 4, 6, 6)
    d_conv = d_relu * (conv > 0)
    dK = np.einsum("nfrc,nrcp->fp", d_conv, P).reshape(4, 3, 3)
    dkb = d_conv.sum(axis=(0, 2, 3))
    loss = -np.log(probs[np.arange(N), Y] + 1e-12).mean()
    return loss, [dK, dkb, dW, db]


def main():
    rng = np.random.default_rng(7)
    Xtr, Ytr = make(4000, rng)
    Xte, Yte = make(1000, rng)
    params = [rng.normal(0, 0.5, (4, 3, 3)), np.zeros(4), rng.normal(0, 0.2, (10, 36)), np.zeros(10)]
    m = [np.zeros_like(p) for p in params]
    v = [np.zeros_like(p) for p in params]
    t = 0
    for epoch in range(25):
        order = rng.permutation(len(Ytr))
        for s in range(0, len(order), 32):
            idx = order[s:s + 32]
            loss, g = grads(params, Xtr[idx], Ytr[idx])
            t += 1
            for k in range(4):
                m[k] = 0.9 * m[k] + 0.1 * g[k]
                v[k] = 0.999 * v[k] + 0.001 * g[k] ** 2
                params[k] = params[k] - 0.01 * (m[k] / (1 - 0.9**t)) / (np.sqrt(v[k] / (1 - 0.999**t)) + 1e-8)
    acc = lambda X, Y: float((forward(params, X)[-1].argmax(axis=1) == Y).mean())
    noisy = make(1000, np.random.default_rng(11), noise=0.15)
    report = {"test": acc(Xte, Yte), "noise15": acc(*noisy)}
    clean = np.array([draw(d, 1, 0) for d in range(10)])
    report["cleanCentered"] = acc(clean, np.arange(10))
    K, kb, W, b = params
    out_dir = Path(__file__).resolve().parents[2] / "src" / "lessons" / "convolutional-neural-network"
    weights = {"kernels": np.round(K, 6).tolist(), "kernelBias": np.round(kb, 6).tolist(), "W": np.round(W, 6).tolist(), "b": np.round(b, 6).tolist()}
    (out_dir / "weights.json").write_text(json.dumps(weights) + "\n", encoding="utf-8")
    # Fixtures: forward pass with the *rounded* weights the browser uses.
    rparams = [np.array(weights["kernels"]), np.array(weights["kernelBias"]), np.array(weights["W"]), np.array(weights["b"])]
    samples = np.array([draw(d, d % 4, d % 2) for d in (0, 3, 5, 8, 9)])
    _, conv, relu, pooled, _, probs = forward(rparams, samples)
    fixtures = {
        "font": {str(d): FONT[d] for d in FONT},
        "samples": samples.astype(int).tolist(),
        "conv": conv.tolist(),
        "pooled": pooled.tolist(),
        "probs": probs.tolist(),
        "report": report,
    }
    (out_dir / "fixtures.json").write_text(json.dumps(fixtures) + "\n", encoding="utf-8")
    print("accuracy", report)


if __name__ == "__main__":
    main()
