"""Reference results for the PCA lesson (2D): population covariance, numpy.linalg.eigh,
the first component's angle in [0°, 180°), and the variance along a few directions.
Writes src/lessons/pca/fixtures.json.

    python tools/fixtures/pca.py
"""

import json
import math
from pathlib import Path

import numpy as np

POINTS = [(2.0, 2.4), (3.1, 3.0), (3.6, 4.1), (4.2, 4.0), (5.0, 5.6), (5.4, 5.1),
          (6.1, 6.6), (6.6, 6.2), (7.4, 7.9), (8.0, 7.6), (4.6, 3.2), (5.6, 6.9)]


def main():
    X = np.array(POINTS)
    C = np.cov(X.T, bias=True)
    vals, vecs = np.linalg.eigh(C)
    v1 = vecs[:, 1]
    angle = math.degrees(math.atan2(v1[1], v1[0])) % 180
    def along(deg):
        u = np.array([math.cos(math.radians(deg)), math.sin(math.radians(deg))])
        return float(u @ C @ u)
    out = {
        "points": POINTS,
        "mean": X.mean(axis=0).tolist(),
        "cov": [C[0, 0], C[0, 1], C[1, 1]],
        "lambda1": float(vals[1]),
        "lambda2": float(vals[0]),
        "pc1Angle": angle,
        "along": {str(d): along(d) for d in (0, 30, 90, 144)},
    }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "pca" / "fixtures.json"
    target.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {target}: pc1 {angle:.2f}°, explained {vals[1] / vals.sum():.3f}")


if __name__ == "__main__":
    main()
