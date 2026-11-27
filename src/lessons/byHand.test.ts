import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { byHandFor } from "./byHand";
import { fmt, term } from "./shared/hand";

describe("hand-written numbers", () => {
  it("rounds, drops trailing zeros and uses a real minus sign", () => {
    expect(fmt(-72)).toBe("−72");
    expect(fmt(1.41421)).toBe("1.41");
    expect(fmt(2.5)).toBe("2.5");
    expect(fmt(-0.0001)).toBe("0");
    expect(fmt(2.625, 3)).toBe("2.625");
  });

  it("brackets negative terms", () => {
    expect(term(-72)).toBe("(−72)");
    expect(term(4)).toBe("4");
  });
});

const vars = (slug: string) => {
  const ex = byHandFor(slug)!;
  return Object.assign({}, ex.vars, ...ex.steps.map((s) => s.vars ?? {}));
};

describe("worked examples", () => {
  it("exist for every live lesson", () => {
    for (const l of liveLessons()) expect(byHandFor(l.slug), l.slug).toBeDefined();
  });

  it("linear regression: the car-price example gives y = −72x + 968", () => {
    expect(vars("linear-regression")).toMatchObject({ xMean: "4", yMean: "680", sxy: "−1440", sxx: "20", slope: "−72", intercept: "968", prediction: "680" });
  });

  it("gradient descent walks w from 0 towards 3, halving the gap", () => {
    expect(vars("gradient-descent")).toMatchObject({ w1: "1.5", w2: "2.25", w3: "2.625" });
  });

  it("logistic regression: probabilities, mean log loss and the boundary", () => {
    expect(vars("logistic-regression")).toMatchObject({ p1: "0.05", p4: "0.95", loss: "0.18", boundary: "2.5" });
  });

  it("k-NN: the 3 nearest are at 1.41, 1.41 and 2, and good wins", () => {
    expect(vars("k-nearest-neighbors")).toMatchObject({ d1: "1.41", d2: "1.41", d3: "2", goodVotes: "3", badVotes: "0", winner: "{good}" });
  });

  it("decision tree: outlook beats windy on Gini", () => {
    expect(vars("decision-tree")).toMatchObject({ root: "0.44", giniOutlook: "0.22", giniWindy: "0.33", best: "{outlook}" });
  });

  it("random forest: 2 of 3 trees say yes", () => {
    expect(vars("random-forest")).toMatchObject({ yesVotes: "2", noVotes: "1", winner: "{yes}", oob: "4, 5" });
  });

  it("SVM: two support vectors and a margin of 1.41", () => {
    expect(vars("support-vector-machine")).toMatchObject({ supports: "2", width: "1.41", score: "2", winner: "+1" });
  });

  it("k-means settles after two updates", () => {
    expect(vars("k-means")).toMatchObject({ rounds: "2", c1: "(1.33, 1.33)", c2: "(5.33, 4.67)" });
  });

  it("PCA: eigenvalues 2.75 and 0.25 (dividing by n, like the Lab), the first keeps 91.7%", () => {
    expect(vars("pca")).toMatchObject({ l1: "2.75", l2: "0.25", kept: "91.7" });
  });

  it("neural network: the forward pass ends at 0.97", () => {
    expect(vars("neural-network")).toMatchObject({ h1: "1.5", h2: "0", z: "3.5", out: "0.97" });
  });

  it("backpropagation: gradients, one update, and the loss falls", () => {
    expect(vars("backpropagation")).toMatchObject({ loss: "0.125", gw2: "0.5", gw1: "1.5", w1new: "0.35", w2new: "1.45", lossNew: "0.0001" });
  });

  it("CNN: one edge gives −3, the other 3, and ReLU keeps only the second", () => {
    expect(vars("convolutional-neural-network")).toMatchObject({ first: "−3", second: "3", pooled: "3" });
  });

  it("RNN: the state after three steps", () => {
    expect(vars("recurrent-neural-network")).toMatchObject({ h1: "0.46", h2: "0.9", h3: "0.38" });
  });

  it("attention: the weights sum to 1 and favour the last word", () => {
    expect(vars("attention-transformers")).toMatchObject({ a1: "0.28", a2: "0.14", a3: "0.58" });
  });

  it("every table row is as wide as its header", () => {
    for (const l of liveLessons()) {
      const ex = byHandFor(l.slug)!;
      const blocks = [...ex.given, ...ex.steps.flatMap((s) => s.blocks)];
      for (const b of blocks) {
        if (!("table" in b)) continue;
        for (const r of [...b.table.rows, ...(b.table.foot ? [b.table.foot] : [])]) expect(r, l.slug).toHaveLength(b.table.headers.length);
      }
    }
  });
});
