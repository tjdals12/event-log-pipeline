import { REGISTRY } from "@/registry";
import { Layer, LAYERS } from "@/registry/types";
import { Manifest } from "./manifest.schema";

const assertLayer: (value: string) => asserts value is Layer = (value) => {
  const valid = (LAYERS as readonly string[]).includes(value);
  if (!valid)
    throw new Error(`Invalid layer '${value}'. Allowed: bronze, silver, gold.`);
};

const assertTableRegistered = (layer: Layer, table: string) => {
  const registry = REGISTRY[layer][table];
  if (!registry) throw new Error(`Unknown table '${table}' in layer ${layer}`);
};

export const parseLayerAndTable = (
  dataset: string
): { layer: Layer; table: string } => {
  const [layer, table] = dataset.split("/");

  if (!layer || !table)
    throw new Error(
      `Invalid dataset format: ${dataset}. Expected '<layer>/<table>'.`
    );

  assertLayer(layer);

  assertTableRegistered(layer, table);

  return {
    layer,
    table,
  };
};

export const assertManifest = (manifest: Manifest) => {
  const { tasks } = manifest;

  if (tasks.length === 0) throw new Error("No tasks defined in manifest");

  for (const task of tasks) {
    const { dataset } = task;

    parseLayerAndTable(dataset);
  }
};
