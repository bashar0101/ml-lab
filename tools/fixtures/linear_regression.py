"""Reference results for the linear regression lesson.

Runs the exact training loop shown in the lesson's Python tab on every preset and writes
src/lessons/linear-regression/fixtures.json. The TypeScript algorithm is tested against it.

    python tools/fixtures/linear_regression.py
"""

import json
from pathlib import Path

import numpy as np

LR, STEPS, INIT_W, INIT_B = 0.1, 40, -10.0, 20.0

STUDY = [(1, 42), (2, 48), (3, 50), (4, 61), (5, 63), (6, 70), (7, 72), (8, 83), (9, 85)]
PRESETS = {
    "study-hours": STUDY,
    "house-prices": [(50, 150), (60, 180), (70, 195), (80, 230), (90, 240),
                     (100, 275), (110, 290), (120, 330), (130, 345), (140, 370)],
    "outlier": STUDY + [(8.5, 15)],
}


def train(hours, y, lr=LR, steps=STEPS, w=INIT_W, b=INIT_B, record=()):
    """The lesson's training loop (np.std is the population std, ddof=0)."""
    x = (hours - hours.mean()) / hours.std()
    seen = {}
    for step in range(steps):
        guess = w * x + b
        error = guess - y
        w -= lr * 2 * (error * x).mean()
        b -= lr * 2 * error.mean()
        if step + 1 in record:
            seen[step + 1] = {"w": w, "b": b}
    return w, b, seen


def main():
    out = {}
    for name, pts in PRESETS.items():
        hours = np.array([p[0] for p in pts], dtype=float)
        y = np.array([p[1] for p in pts], dtype=float)
        w, b, seen = train(hours, y, record=(1, 8))
        slope, intercept = np.polyfit(hours, y, 1)
        out[name] = {
            "step1": seen[1],
            "step8": seen[8],
            "final": {"w": w, "b": b},
            "lstsq": {"slope": float(slope), "intercept": float(intercept)},
        }
    target = Path(__file__).resolve().parents[2] / "src" / "lessons" / "linear-regression" / "fixtures.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {target}: {len(out)} entries")


if __name__ == "__main__":
    main()
