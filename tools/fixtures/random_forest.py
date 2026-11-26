"""Reference random forest for the random forest lesson.

Each tree: a bootstrap sample (n draws with replacement) and, at every node that gets as far
as looking for a question, one feature picked at random. Randomness is the mulberry32 port,
called in exactly the same order as the TypeScript code.
Writes src/lessons/random-forest/fixtures.json.

    python tools/fixtures/random_forest.py
"""

import json
from pathlib import Path

from cart import POINTS_2, grow
from mulberry32 import mulberry32


def forest(points, trees, max_depth, seed):
    rand = mulberry32(seed)
    n = len(points)
    out = []
    for _ in range(trees):
        sample = [int(rand() * n) for _ in range(n)]
        pts = [points[i] for i in sample]
        nodes = grow(pts, max_depth, 1, features=lambda node: (0,) if rand() < 0.5 else (1,))
        out.append({"sample": sample, "nodes": nodes})
    return out


def main():
    out = {"points": POINTS_2, "trees": forest(POINTS_2, 3, 3, 1)}
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "random-forest" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
