"""Reference predictions for the k-nearest neighbors lesson.

Same rules as the lesson's Python tab: stable sort by distance, majority vote, a tie is
won by the class of the closest point among the tied classes.
Writes src/lessons/k-nearest-neighbors/fixtures.json.

    python tools/fixtures/k_nearest_neighbors.py
"""

import json
from pathlib import Path

import numpy as np

POINTS = [
    (2.0, 3.0, 0), (3.1, 2.2, 0), (2.6, 4.4, 0), (4.0, 3.1, 0), (3.5, 5.2, 1), (1.8, 2.5, 0),
    (6.5, 6.0, 1), (7.2, 5.1, 1), (5.9, 7.3, 1), (4.8, 4.2, 0), (6.1, 4.9, 1), (8.0, 7.0, 1),
]
QUERIES = [(5.0, 5.0), (3.0, 3.0), (4.5, 4.8), (7.0, 7.0), (4.2, 5.5), (5.5, 3.5)]


def knn_predict(X, y, query, k, metric):
    if metric == "euclidean":
        d = np.sqrt(((X - query) ** 2).sum(axis=1))
    else:
        d = np.abs(X - query).sum(axis=1)
    nearest = np.argsort(d, kind="stable")[:k]
    votes = np.bincount(y[nearest], minlength=2)
    top = votes.max()
    for i in nearest:  # tie: the closest point decides
        if votes[y[i]] == top:
            return int(y[i]), votes.tolist(), nearest.tolist()


def main():
    X = np.array([p[:2] for p in POINTS], dtype=float)
    y = np.array([p[2] for p in POINTS])
    cases = []
    for q in QUERIES:
        for k in (1, 5, 15):
            for metric in ("euclidean", "manhattan"):
                pred, votes, nearest = knn_predict(X, y, np.array(q), min(k, len(y)), metric)
                cases.append({"query": q, "k": k, "metric": metric, "prediction": pred, "votes": votes, "nearest": nearest})
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "k-nearest-neighbors" / "fixtures.json"
    target.write_text(json.dumps({"points": POINTS, "cases": cases}, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}: {len(cases)} cases")


if __name__ == "__main__":
    main()
