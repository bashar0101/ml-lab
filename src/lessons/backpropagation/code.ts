import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "x, y = X[0], Y[0]                    # one example", key: "init" },
  { text: "a = [x]                               # forward: left → right", key: "forward" },
  { text: "for l in range(L):", key: "forward" },
  { text: "    z[l] = W[l] @ a[l] + b[l]", key: "forward" },
  { text: "    a.append(act(z[l]) if l < L - 1 else sigmoid(z[l]))", key: "forward" },
  { text: "loss = -(y * log(a[L]) + (1 - y) * log(1 - a[L]))", key: "loss" },
  { text: "dz[L-1] = a[L] - y                    # backward: right → left", key: "backward" },
  { text: "for l in range(L - 2, -1, -1):", key: "backward" },
  { text: "    dz[l] = (W[l+1].T @ dz[l+1]) * act_slope(z[l])", key: "backward" },
  { text: "dW = [np.outer(dz[l], a[l]) for l in range(L)]", key: "grads" },
  { text: "W = [w - lr * g for w, g in zip(W, dW)]", key: "update" },
  { text: "# then: average dW over all points, every epoch", key: "epoch" },
  { text: "", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "take one example", key: "init" },
  { text: "forward: compute every neuron, layer by layer", key: "forward" },
  { text: "measure the loss of the prediction", key: "loss" },
  { text: "backward: blame at the output = prediction − truth", key: "backward" },
  { text: "    each earlier neuron's blame = weighted blame", key: "backward" },
  { text: "    from the layer after × its own slope", key: "backward" },
  { text: "each weight's gradient = blame × input it saw", key: "grads" },
  { text: "step every weight against its gradient", key: "update" },
  { text: "repeat for all points, many epochs", key: "epoch" },
  { text: "", key: "return" },
];
