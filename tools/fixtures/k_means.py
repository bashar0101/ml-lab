"""Reference runs for the k-means lesson.

Lloyd's algorithm with the lesson's rules: random init = the first k of a mulberry32
Fisher-Yates shuffle; k-means++ = D² sampling with mulberry32; nearest centroid ties go to
the lowest index; an empty cluster keeps its centroid; stop when no point changes cluster.
Writes src/lessons/k-means/fixtures.json.

    python tools/fixtures/k_means.py
"""

import json
from pathlib import Path

from mulberry32 import mulberry32, shuffled

POINTS = [
    (1.0, 1.0), (1.5, 2.0), (2.0, 1.2), (8.0, 8.0), (8.5, 7.5), (7.6, 8.4),
    (1.2, 8.0), (2.0, 8.6), (1.6, 7.4), (5.0, 5.0), (4.6, 5.6), (8.2, 1.4),
]


def d2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def init(points, k, kind, rand):
    n = len(points)
    if kind == "random":
        return [points[i] for i in shuffled(n, rand)[:k]]
    cents = [points[int(rand() * n)]]
    while len(cents) < k:
        dist = [min(d2(p, c) for c in cents) for p in points]
        r = rand() * sum(dist)
        acc = 0.0
        pick = n - 1
        for i, dv in enumerate(dist):
            acc += dv
            if acc >= r and dv > 0:
                pick = i
                break
        cents.append(points[pick])
    return cents


def kmeans(points, k, kind, seed, max_iter=20):
    rand = mulberry32(seed)
    cents = [tuple(c) for c in init(points, k, kind, rand)]
    assign = None
    history = []
    for it in range(1, max_iter + 1):
        new = [min(range(k), key=lambda j: (d2(p, cents[j]), j)) for p in points]
        if assign is not None and new == assign:
            break
        assign = new
        for j in range(k):
            members = [p for p, a in zip(points, assign) if a == j]
            if members:
                cents[j] = (sum(p[0] for p in members) / len(members), sum(p[1] for p in members) / len(members))
        history.append({"assign": assign, "centroids": [list(c) for c in cents]})
    return history


def main():
    out = {
        "points": POINTS,
        "random": kmeans(POINTS, 3, "random", 9),
        "plusPlus": kmeans(POINTS, 4, "plus-plus", 13),
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "k-means" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}: {len(out['random'])} / {len(out['plusPlus'])} iterations")


if __name__ == "__main__":
    main()
