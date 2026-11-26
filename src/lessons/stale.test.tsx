import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ui from "../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { loadLessonModule } from "./registry";

/** Parts of each picture that come from the trained model (not from the student's data). */
const MODEL_PARTS: Record<string, string[]> = {
  "linear-regression": ["line", "residual", "bowl", "path", "current"],
  "logistic-regression": ["boundary", "shade"],
  "k-nearest-neighbors": ["distance", "neighbour", "radius", "map", "votes"],
  "support-vector-machine": ["boundary", "margin", "support", "shade", "strip"],
  "decision-tree": ["region", "split-line", "tree-node"],
  "random-forest": ["tree-map", "forest-map", "thumb"],
  "k-means": ["centroid", "trail", "regions", "chart"],
  pca: ["direction", "projection", "axis", "mean", "curve", "explained", "projected"],
  "neural-network": ["shade", "node-value", "probe", "edge"],
  backpropagation: ["value", "blame", "edge-grad", "grad-bar"],
};

describe.each(Object.entries(MODEL_PARTS))("%s with stale data", (slug, parts) => {
  it("draws the points but none of the old model", async () => {
    const mod = await loadLessonModule(slug);
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = render(
      <UiProvider strings={ui}>
        <mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" stale />
      </UiProvider>,
    );
    // The backpropagation picture is a network diagram; it has no data points to keep.
    if (slug !== "backpropagation") expect(container.querySelectorAll("[data-part=point]").length).toBeGreaterThan(0);
    for (const part of parts) expect(container.querySelector(`[data-part=${part}]`), part).toBeNull();
  });
});
