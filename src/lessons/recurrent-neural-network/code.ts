import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "h = np.zeros(6)                   # memory starts empty", key: "init" },
  { text: "for ch in text:                   # one letter at a time", key: "read" },
  { text: "    x = one_hot(ch)               # 8 letters → 8 numbers", key: "read" },
  { text: "    h = np.tanh(Wx @ x + memory * (Wh @ h) + b)", key: "read" },
  { text: "p = sigmoid(v @ h + c)            # chance it started with 'a'", key: "predict" },
  { text: "# memory = 1.0 is the trained network", key: "predict" },
];

export const pseudo: CodeLine[] = [
  { text: "start with an empty memory (6 numbers)", key: "init" },
  { text: "for each letter:", key: "read" },
  { text: "    new memory = squash(letter's weights", key: "read" },
  { text: "                  + old memory's weights)", key: "read" },
  { text: "read the final memory: did it start with a?", key: "predict" },
];
