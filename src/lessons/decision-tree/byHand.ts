import { fmt, type HandExample } from "../shared/hand";

type Day = { outlook: "sunny" | "rainy"; windy: boolean; play: boolean };

const DAYS: Day[] = [
  { outlook: "sunny", windy: false, play: true },
  { outlook: "sunny", windy: true, play: true },
  { outlook: "sunny", windy: true, play: true },
  { outlook: "rainy", windy: true, play: false },
  { outlook: "rainy", windy: false, play: true },
  { outlook: "rainy", windy: true, play: false },
];

/** Gini impurity of a group with `yes` and `no` members, and the formula written out. */
function gini(yes: number, no: number) {
  const n = yes + no;
  const value = 1 - (yes / n) ** 2 - (no / n) ** 2;
  return { value, text: `1 − (${yes}/${n})² − (${no}/${n})² = ${fmt(value)}` };
}

function split(days: Day[], test: (d: Day) => boolean) {
  const left = days.filter(test);
  const right = days.filter((d) => !test(d));
  const count = (g: Day[]) => ({ yes: g.filter((d) => d.play).length, no: g.filter((d) => !d.play).length });
  const l = count(left);
  const r = count(right);
  const gl = gini(l.yes, l.no);
  const gr = gini(r.yes, r.no);
  const n = days.length;
  const weighted = (left.length / n) * gl.value + (right.length / n) * gr.value;
  return { l, r, gl, gr, weighted, nl: left.length, nr: right.length, n };
}

/** Six days of "do we play outside?": pick the first question by Gini impurity, then grow the tree. */
export function decisionTreeByHand(): HandExample {
  const yes = DAYS.filter((d) => d.play).length;
  const root = gini(yes, DAYS.length - yes);
  const byOutlook = split(DAYS, (d) => d.outlook === "sunny");
  const byWindy = split(DAYS, (d) => d.windy);
  const best = byOutlook.weighted <= byWindy.weighted ? "{outlook}" : "{windy}";
  const rainy = DAYS.filter((d) => d.outlook === "rainy");
  const rainyWindy = split(rainy, (d) => d.windy);
  const yn = (v: boolean) => (v ? "{yes}" : "{no}");

  const splitTable = (s: ReturnType<typeof split>, a: string, b: string) => ({
    table: {
      headers: ["{branch}", "{yes}", "{no}", "Gini"],
      rows: [
        [a, String(s.l.yes), String(s.l.no), s.gl.text],
        [b, String(s.r.yes), String(s.r.no), s.gr.text],
      ],
    },
  });

  return {
    given: [
      {
        table: {
          headers: ["{day}", "{outlook}", "{windy}", "{play}"],
          rows: DAYS.map((d, i) => [String(i + 1), `{${d.outlook}}`, yn(d.windy), yn(d.play)]),
        },
      },
    ],
    vars: {},
    steps: [
      {
        id: "root",
        vars: { root: fmt(root.value), yesDays: String(yes), noDays: String(DAYS.length - yes) },
        blocks: [{ math: ["Gini = 1 − p({yes})² − p({no})²", `Gini = ${root.text}`] }],
      },
      {
        id: "outlook",
        vars: { giniOutlook: fmt(byOutlook.weighted) },
        blocks: [
          splitTable(byOutlook, "{sunny}", "{rainy}"),
          {
            math: [
              `${byOutlook.nl}/${byOutlook.n} · ${fmt(byOutlook.gl.value)} + ${byOutlook.nr}/${byOutlook.n} · ${fmt(byOutlook.gr.value)} = ${fmt(byOutlook.weighted)}`,
            ],
          },
        ],
      },
      {
        id: "windy",
        vars: { giniWindy: fmt(byWindy.weighted) },
        blocks: [
          splitTable(byWindy, "{windy}: {yes}", "{windy}: {no}"),
          {
            math: [
              `${byWindy.nl}/${byWindy.n} · ${fmt(byWindy.gl.value)} + ${byWindy.nr}/${byWindy.n} · ${fmt(byWindy.gr.value)} = ${fmt(byWindy.weighted)}`,
            ],
          },
        ],
      },
      {
        id: "choose",
        vars: { best, gain: fmt(root.value - Math.min(byOutlook.weighted, byWindy.weighted)) },
        blocks: [
          {
            math: [
              `{outlook}: ${fmt(byOutlook.weighted)}   {windy}: ${fmt(byWindy.weighted)}`,
              `${fmt(root.value)} − ${fmt(Math.min(byOutlook.weighted, byWindy.weighted))} = ${fmt(root.value - Math.min(byOutlook.weighted, byWindy.weighted))}`,
            ],
          },
        ],
      },
      {
        id: "grow",
        vars: { giniRainy: fmt(rainyWindy.weighted) },
        blocks: [
          splitTable(rainyWindy, "{rainy}, {windy}: {yes}", "{rainy}, {windy}: {no}"),
          {
            math: [
              "{outlook} = {sunny}  →  {play}: {yes}",
              "{outlook} = {rainy}, {windy} = {yes}  →  {play}: {no}",
              "{outlook} = {rainy}, {windy} = {no}  →  {play}: {yes}",
            ],
          },
        ],
      },
    ],
  };
}
