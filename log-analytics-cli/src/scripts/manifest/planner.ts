import { Layer } from "@/registry/types";

import { loadManifest } from "./load-manifest";
import { assertManifest, parseLayerAndTable } from "./assert-manifest";
import { buildDag, assertAcyclic, topologicalSort } from "./graph";

export const loadExecutionOrder = (
  manifestPath: string
): { layer: Layer; table: string }[] => {
  const manifest = loadManifest(manifestPath);
  assertManifest(manifest);

  const { tasks } = manifest;
  const { datasets, dependsOnByDataset } = buildDag(tasks);
  assertAcyclic({ datasets, dependsOnByDataset });

  const sorted = topologicalSort({ datasets, dependsOnByDataset });

  const order = sorted.map((dataset) => parseLayerAndTable(dataset));

  return order;
};
