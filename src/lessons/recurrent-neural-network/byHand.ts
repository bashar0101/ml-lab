import { fmt, term, type HandExample } from "../shared/hand";

/** A one-number RNN, h_t = tanh(wx·x_t + wh·h_(t−1)), run over a sequence of three inputs. */
export function recurrentNeuralNetworkByHand(): HandExample {
  const wx = 0.5;
  const wh = 1;
  const xs = [1, 2, -1];
  const hs = [0];
  const rows: string[][] = [];
  const lines: string[] = [];
  xs.forEach((x, t) => {
    const prev = hs[t];
    const a = wx * x + wh * prev;
    const h = Math.tanh(a);
    hs.push(h);
    rows.push([String(t + 1), fmt(x), fmt(prev), fmt(wx * x), fmt(wh * prev), fmt(a), fmt(h)]);
    lines.push(`h${t + 1} = tanh(${fmt(wx)} · ${term(x)} + ${fmt(wh)} · ${fmt(prev)}) = tanh(${fmt(a)}) = ${fmt(h)}`);
  });

  return {
    given: [{ math: [`x = (${xs.map((v) => fmt(v)).join(", ")})    h0 = 0`, `wx = ${fmt(wx)}    wh = ${fmt(wh)}`, "h_t = tanh(wx · x_t + wh · h_(t−1))"] }],
    vars: {},
    steps: [
      { id: "t1", vars: { h1: fmt(hs[1]) }, blocks: [{ math: [lines[0]] }] },
      { id: "t2", vars: { h2: fmt(hs[2]) }, blocks: [{ math: [lines[1]] }] },
      { id: "t3", vars: { h3: fmt(hs[3]) }, blocks: [{ math: [lines[2]] }] },
      {
        id: "table",
        blocks: [{ table: { headers: ["t", "x_t", "h_(t−1)", "wx · x_t", "wh · h_(t−1)", "{sum}", "h_t"], rows } }],
      },
    ],
  };
}
