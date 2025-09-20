import type { Layer, Registry } from "./types";
import bronze from "./bronze";
import silver from "./silver";
import gold from "./gold";

const REGISTRY: Record<Layer, Registry> = {
  bronze,
  silver,
  gold,
};

export const resolveJob = (args: {
  layer: Layer;
  dataset: string;
  action: string;
}) => {
  const { layer, dataset, action } = args;

  const layerMap = REGISTRY[layer];
  if (!layerMap) {
    const layers = Object.keys(REGISTRY).join(", ") || "(none)";
    throw new Error(`Unsupported layer "${layer}". Available: ${layers}`);
  }

  const entry = layerMap[dataset];
  if (!entry) {
    const datasets = Object.keys(layerMap).join(", ") || "(none)";
    throw new Error(
      `Unsupported target "${layer}.${dataset}". Available: ${datasets}`
    );
  }

  const handler = entry[action];
  if (!handler) {
    const actions = Object.keys(entry).join(", ") || "(none)";
    throw new Error(
      `Unsupported action "${action}" for "${layer}.${dataset}". Availabe: ${actions}`
    );
  }
  return handler;
};

export { bronze, silver, gold };
