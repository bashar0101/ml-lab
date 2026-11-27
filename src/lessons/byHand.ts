import { attentionTransformersByHand } from "./attention-transformers/byHand";
import { backpropagationByHand } from "./backpropagation/byHand";
import { convolutionalNeuralNetworkByHand } from "./convolutional-neural-network/byHand";
import { decisionTreeByHand } from "./decision-tree/byHand";
import { gradientDescentByHand } from "./gradient-descent/byHand";
import { kMeansByHand } from "./k-means/byHand";
import { kNearestNeighborsByHand } from "./k-nearest-neighbors/byHand";
import { linearRegressionByHand } from "./linear-regression/byHand";
import { logisticRegressionByHand } from "./logistic-regression/byHand";
import { neuralNetworkByHand } from "./neural-network/byHand";
import { pcaByHand } from "./pca/byHand";
import { randomForestByHand } from "./random-forest/byHand";
import { recurrentNeuralNetworkByHand } from "./recurrent-neural-network/byHand";
import type { HandExample } from "./shared/hand";
import { supportVectorMachineByHand } from "./support-vector-machine/byHand";

/**
 * The worked example for each lesson. Only the lesson page (a server component) imports this:
 * the examples are computed at build time and reach the browser as plain data.
 */
const BY_HAND: Record<string, () => HandExample> = {
  "linear-regression": linearRegressionByHand,
  "gradient-descent": gradientDescentByHand,
  "logistic-regression": logisticRegressionByHand,
  "k-nearest-neighbors": kNearestNeighborsByHand,
  "decision-tree": decisionTreeByHand,
  "random-forest": randomForestByHand,
  "support-vector-machine": supportVectorMachineByHand,
  "k-means": kMeansByHand,
  pca: pcaByHand,
  "neural-network": neuralNetworkByHand,
  backpropagation: backpropagationByHand,
  "convolutional-neural-network": convolutionalNeuralNetworkByHand,
  "recurrent-neural-network": recurrentNeuralNetworkByHand,
  "attention-transformers": attentionTransformersByHand,
};

/**
 * Lessons whose Lab can open on the paper example (their module's `byHand`). A test keeps this
 * list equal to the modules, so the lesson page can offer the button without loading the module.
 */
export const LAB_EXAMPLES: ReadonlySet<string> = new Set([
  "linear-regression",
  "gradient-descent",
  "k-nearest-neighbors",
  "support-vector-machine",
  "k-means",
  "pca",
]);

export function byHandFor(slug: string): HandExample | undefined {
  return BY_HAND[slug]?.();
}
