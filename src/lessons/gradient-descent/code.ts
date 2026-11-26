import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: 'def descend(grad, start, lr=0.18, steps=40, method="plain"):' },
  { text: "    x = np.array(start, dtype=float)", key: "init" },
  { text: "    v = m = s = np.zeros(2)", key: "init" },
  { text: "    for t in range(1, steps + 1):" },
  { text: "        g = grad(x)", key: "grad" },
  { text: '        if method == "plain":' },
  { text: "            x = x - lr * g", key: "update-plain" },
  { text: '        elif method == "momentum":' },
  { text: "            v = 0.9 * v + g", key: "update-momentum" },
  { text: "            x = x - lr * v", key: "update-momentum" },
  { text: "        else:  # adam" },
  { text: "            m = 0.9 * m + 0.1 * g", key: "update-adam" },
  { text: "            s = 0.999 * s + 0.001 * g**2", key: "update-adam" },
  { text: "            m_hat = m / (1 - 0.9**t)", key: "update-adam" },
  { text: "            s_hat = s / (1 - 0.999**t)", key: "update-adam" },
  { text: "            x = x - lr * m_hat / (np.sqrt(s_hat) + 1e-8)", key: "update-adam" },
  { text: "    return x", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "stand at the start point", key: "init" },
  { text: "repeat steps times:" },
  { text: "    feel the slope under your feet (the gradient)", key: "grad" },
  { text: "    plain: step straight against the slope", key: "update-plain" },
  { text: "    momentum: keep most of your speed,", key: "update-momentum" },
  { text: "              add the new slope, then step", key: "update-momentum" },
  { text: "    adam: keep a running average of the slope", key: "update-adam" },
  { text: "          and of its size, take an even step", key: "update-adam" },
  { text: "return where you ended up", key: "return" },
];
