import type { CodeLine } from "../types";

export const python: CodeLine[] = [
  { text: "X = data                      # n points, 2 features", key: "init" },
  { text: "X0 = X - X.mean(axis=0)       # centre the cloud", key: "center" },
  { text: "C = X0.T @ X0 / len(X)        # covariance", key: "center" },
  { text: "for deg in range(0, 181, 6):  # try every direction", key: "sweep" },
  { text: "    u = np.array([np.cos(np.radians(deg)), np.sin(np.radians(deg))])", key: "sweep" },
  { text: "    spread = u @ C @ u        # variance of the shadows", key: "sweep" },
  { text: "values, vectors = np.linalg.eigh(C)   # the exact answer", key: "pc1" },
  { text: "pc1 = vectors[:, 1]           # most spread", key: "pc1" },
  { text: "pc2 = vectors[:, 0]           # at right angles", key: "pc2" },
  { text: "z = X0 @ pc1                  # one number per point", key: "project" },
  { text: "X_back = X.mean(axis=0) + np.outer(z, pc1)", key: "project" },
  { text: "kept = values[1] / values.sum()", key: "return" },
];

export const pseudo: CodeLine[] = [
  { text: "start from the cloud of points", key: "init" },
  { text: "move it so its middle is at the origin", key: "center" },
  { text: "for every direction: shine a light, measure", key: "sweep" },
  { text: "    how spread out the shadows are", key: "sweep" },
  { text: "the most spread-out direction is PC1", key: "pc1" },
  { text: "PC2 is at right angles to it", key: "pc2" },
  { text: "keep only the position along PC1", key: "project" },
  { text: "report how much of the spread was kept", key: "return" },
];
