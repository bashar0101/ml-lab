import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "def train(hours, y, lr=0.1, steps=40):" },
  { text: "    x = (hours - hours.mean()) / hours.std()", key: "init" },
  { text: "    w, b = -10.0, 20.0", key: "init" },
  { text: "    for step in range(steps):" },
  { text: "        guess = w * x + b", key: "predict" },
  { text: "        error = guess - y", key: "error" },
  { text: "        w -= lr * 2 * (error * x).mean()", key: "update" },
  { text: "        b -= lr * 2 * error.mean()", key: "update" },
  { text: "    return w, b", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "scale x so its mean is 0 and spread is 1", key: "init" },
  { text: "start with a random line: w = −10, b = 20", key: "init" },
  { text: "repeat steps times:" },
  { text: "    guess ← w·x + b for every point", key: "predict" },
  { text: "    error ← guess − real value", key: "error" },
  { text: "    nudge w and b a little downhill", key: "update" },
  { text: "return the line", key: "return" },
];
