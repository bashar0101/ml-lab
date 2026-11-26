import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "tokens = sentence.split()", key: "init" },
  { text: "x = E[tokens] + P[: len(tokens)]     # meaning + position", key: "embed" },
  { text: "Q, K, V = x @ Wq[h], x @ Wk[h], x @ Wv[h]", key: "scores" },
  { text: "scores = Q[i] @ K.T / np.sqrt(d_k)   # how well each key fits", key: "scores" },
  { text: "weights = softmax(scores)            # sums to 1", key: "softmax" },
  { text: "out = weights @ V                    # blend of meanings", key: "mix" },
  { text: "A = softmax(Q @ K.T / np.sqrt(d_k), axis=1)  # every word", key: "all" },
];

export const pseudo: CodeLine[] = [
  { text: "split the sentence into words", key: "init" },
  { text: "each word = its meaning + a position wave", key: "embed" },
  { text: "turn every word into a query, a key and a value", key: "scores" },
  { text: "score = how well my query fits each key", key: "scores" },
  { text: "weights = softmax(scores)", key: "softmax" },
  { text: "my output = the values, blended by the weights", key: "mix" },
  { text: "do the same for every word, in every head", key: "all" },
];
