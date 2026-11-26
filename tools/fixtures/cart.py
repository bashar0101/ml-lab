"""Reference CART trees for the decision tree (and random forest) lessons.

Gini impurity, thresholds at midpoints of distinct sorted values, left = value < threshold,
ties broken by: lower weighted gini, then feature 0 before 1, then smaller threshold.
Nodes are grown breadth-first. Writes src/lessons/decision-tree/fixtures.json.

    python tools/fixtures/cart.py
"""

import json
from pathlib import Path

POINTS_2 = [
    (2.0, 3.0, 0), (3.1, 2.2, 0), (2.6, 4.4, 0), (4.0, 3.1, 0), (3.5, 5.2, 1), (1.8, 2.5, 0),
    (6.5, 6.0, 1), (7.2, 5.1, 1), (5.9, 7.3, 1), (4.8, 4.2, 0), (6.1, 4.9, 1), (8.0, 7.0, 1),
]
POINTS_3 = [
    (1.0, 1.0, 0), (2.0, 1.5, 0), (1.5, 2.5, 0), (8.0, 1.0, 1), (7.0, 2.0, 1), (8.5, 2.5, 1),
    (5.0, 8.0, 2), (4.0, 7.5, 2), (6.0, 9.0, 2), (5.0, 5.0, 2), (3.0, 3.0, 0), (6.5, 3.5, 1),
]


def gini(counts):
    n = sum(counts)
    return 0.0 if n == 0 else 1.0 - sum((c / n) ** 2 for c in counts)


def count(points, idx, k):
    out = [0] * k
    for i in idx:
        out[points[i][2]] += 1
    return out


def best_split(points, idx, features, min_leaf, k):
    best = None
    n = len(idx)
    for f in features:
        values = sorted(set(points[i][f] for i in idx))
        for a, b in zip(values, values[1:]):
            t = (a + b) / 2
            left = [i for i in idx if points[i][f] < t]
            right = [i for i in idx if points[i][f] >= t]
            if len(left) < min_leaf or len(right) < min_leaf:
                continue
            w = (len(left) * gini(count(points, left, k)) + len(right) * gini(count(points, right, k))) / n
            if best is None or w < best[2] - 1e-12:
                best = (f, t, w)
    return best


def grow(points, max_depth, min_leaf, features=None):
    k = max(p[2] for p in points) + 1
    k = max(k, 2)
    nodes = [{"depth": 0, "idx": list(range(len(points)))}]
    q = 0
    while q < len(nodes):
        node = nodes[q]
        q += 1
        idx = node["idx"]
        counts = count(points, idx, k)
        node["counts"] = counts
        g = gini(counts)
        node["split"] = None
        if node["depth"] >= max_depth or g == 0 or len(idx) < 2 * min_leaf:
            continue
        feats = features(node) if features else (0, 1)
        s = best_split(points, idx, tuple(sorted(feats)), min_leaf, k)
        if s is None or g - s[2] <= 1e-12:
            continue
        f, t, _ = s
        node["split"] = [f, t]
        nodes.append({"depth": node["depth"] + 1, "idx": [i for i in idx if points[i][f] < t]})
        nodes.append({"depth": node["depth"] + 1, "idx": [i for i in idx if points[i][f] >= t]})
    return [{"depth": n["depth"], "counts": n["counts"], "split": n["split"]} for n in nodes]


def main():
    out = {
        "two": {"points": POINTS_2, "depth3": grow(POINTS_2, 3, 1), "depth1": grow(POINTS_2, 1, 1), "minLeaf4": grow(POINTS_2, 5, 4)},
        "three": {"points": POINTS_3, "depth3": grow(POINTS_3, 3, 1)},
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "decision-tree" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
