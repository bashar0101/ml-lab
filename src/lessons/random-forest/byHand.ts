import { fmt, type HandExample } from "../shared/hand";

/**
 * The decision-tree lesson's six days again. Each tree trains on a bootstrap sample (rows drawn
 * with replacement), so the trees differ; a new day is classified by majority vote.
 */
export function randomForestByHand(): HandExample {
  const rows = 6;
  const draws = [3, 1, 3, 6, 2, 6];
  const picked = new Set(draws);
  const oob = Array.from({ length: rows }, (_, i) => i + 1).filter((r) => !picked.has(r));
  const day = { outlook: "rainy", windy: false };
  const trees: { rule: string; vote: boolean }[] = [
    { rule: "{outlook} = {sunny} ? {yes} : {no}", vote: day.outlook === "sunny" },
    { rule: "{windy} = {yes} ? {no} : {yes}", vote: !day.windy },
    { rule: "{outlook} = {sunny} ? {yes} : ({windy} = {yes} ? {no} : {yes})", vote: day.outlook === "sunny" || !day.windy },
  ];
  const yes = trees.filter((t) => t.vote).length;
  const no = trees.length - yes;
  const yn = (v: boolean) => (v ? "{yes}" : "{no}");

  return {
    given: [{ math: ["{newDay}: {outlook} = {rainy}, {windy} = {no}"] }],
    vars: { trees: String(trees.length) },
    steps: [
      {
        id: "bootstrap",
        vars: { draws: draws.join(", "), unique: String(picked.size), oob: oob.join(", ") },
        blocks: [
          {
            table: {
              headers: ["{draw}", ...draws.map((_, i) => String(i + 1))],
              rows: [["{row}", ...draws.map(String)]],
            },
          },
          { math: [`{sample}: [${draws.join(", ")}]`, `{outOfBag}: ${oob.join(", ")}`] },
        ],
      },
      {
        id: "trees",
        blocks: [
          {
            table: {
              headers: ["{tree}", "{rule}", "{vote}"],
              rows: trees.map((t, i) => [String(i + 1), t.rule, yn(t.vote)]),
            },
          },
        ],
      },
      {
        id: "vote",
        vars: { yesVotes: String(yes), noVotes: String(no), winner: yn(yes > no), share: fmt(yes / trees.length) },
        blocks: [{ math: [`{yes}: ${yes}   {no}: ${no}`, `p({yes}) = ${yes}/${trees.length} = ${fmt(yes / trees.length)}  ⇒  ${yn(yes > no)}`] }],
      },
    ],
  };
}
