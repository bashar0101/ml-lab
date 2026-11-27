import { fmt, term, type HandExample } from "../shared/hand";

/** A 4×4 image with a bright vertical stripe, a 3×3 edge filter, then ReLU and 2×2 max pooling. */
export function convolutionalNeuralNetworkByHand(): HandExample {
  const img = [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
  ];
  const k = [
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
  ];
  const size = img.length - k.length + 1;
  const conv = (r: number, c: number) => {
    let s = 0;
    for (let i = 0; i < k.length; i++) for (let j = 0; j < k.length; j++) s += img[r + i][c + j] * k[i][j];
    return s;
  };
  const map = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => conv(r, c)));
  const relu = map.map((row) => row.map((v) => Math.max(0, v)));
  const pooled = Math.max(...relu.flat());
  const grid = (m: number[][], caption: string) => ({ caption, headers: ["", ...m[0].map((_, j) => `c${j + 1}`)], rows: m.map((row, i) => [`r${i + 1}`, ...row.map((v) => fmt(v))]) });
  const products: string[] = [];
  for (let i = 0; i < k.length; i++) for (let j = 0; j < k.length; j++) products.push(`${img[i][j]}·${term(k[i][j])}`);

  return {
    given: [{ table: grid(img, "{image}") }, { table: grid(k, "{filter}") }],
    vars: { size: `${size}×${size}` },
    steps: [
      {
        id: "first",
        vars: { first: fmt(map[0][0]) },
        blocks: [{ math: [products.slice(0, 3).join(" + "), `+ ${products.slice(3, 6).join(" + ")}`, `+ ${products.slice(6).join(" + ")} = ${fmt(map[0][0])}`] }],
      },
      {
        id: "slide",
        vars: { second: fmt(map[0][1]) },
        blocks: [{ table: grid(map, "{featureMap}") }],
      },
      {
        id: "relu",
        blocks: [{ math: ["ReLU(v) = max(0, v)"] }, { table: grid(relu, "ReLU") }],
      },
      {
        id: "pool",
        vars: { pooled: fmt(pooled) },
        blocks: [{ math: [`max(${relu.flat().map((v) => fmt(v)).join(", ")}) = ${fmt(pooled)}`] }],
      },
    ],
  };
}
