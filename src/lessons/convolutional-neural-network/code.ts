import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "img = drawing            # 8 × 8 grid of 0s and 1s", key: "init" },
  { text: "for f, K in enumerate(kernels):      # 4 learned 3 × 3 filters", key: "conv" },
  { text: "    for r in range(6):", key: "conv" },
  { text: "        for c in range(6):", key: "conv" },
  { text: "            window = img[r:r+3, c:c+3]", key: "conv" },
  { text: "            fmap[f, r, c] = (window * K).sum() + bias[f]", key: "conv" },
  { text: "fmap = np.maximum(fmap, 0)           # ReLU", key: "relu" },
  { text: "pooled = fmap.reshape(4, 3, 2, 3, 2).max(axis=(2, 4))", key: "pool" },
  { text: "features = pooled.reshape(36)        # all four maps", key: "maps" },
  { text: "scores = W @ features + b", key: "dense" },
  { text: "probs = np.exp(scores) / np.exp(scores).sum()", key: "dense" },
  { text: "answer = probs.argmax()", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "the drawing is a grid of numbers", key: "init" },
  { text: "slide a small 3 × 3 filter over it;", key: "conv" },
  { text: "at each spot multiply and add → one number", key: "conv" },
  { text: "keep only positive matches (ReLU)", key: "relu" },
  { text: "shrink each 2 × 2 block to its biggest value", key: "pool" },
  { text: "do this for all four filters", key: "maps" },
  { text: "weigh all those numbers into a score per digit", key: "dense" },
  { text: "answer = the most likely digit", key: "return" },
];
