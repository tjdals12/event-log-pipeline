import { Layer } from "@/registry/types";
import { BaseSchema } from "./base";
import { bronzeSchemas } from "./bronze";
import { silverSchemas } from "./silver";
import { goldSchemas } from "./gold";

const LAYER_SCHEMA_MAP = {
  bronze: bronzeSchemas,
  silver: silverSchemas,
  gold: goldSchemas,
} as const;

export const parseOptions = (
  inputOptions: { layer: Layer } & Record<string, string>
) => {
  const base = BaseSchema.parse(inputOptions);
  const { layer, dataset, action } = base;

  const layerMap = LAYER_SCHEMA_MAP[layer];
  if (!layerMap) {
    const layers = Object.keys(LAYER_SCHEMA_MAP).join(", ") || "(none)";
    throw new Error(`Unsupported layer "${layer}". Available: ${layers}`);
  }

  const datasetMap = layerMap[dataset];
  if (!datasetMap) {
    const datasets = Object.keys(layerMap).join(", ") || "(none)";
    throw new Error(
      `Unsupported target "${layer}.${dataset}". Available: ${datasets}`
    );
  }

  const ext = datasetMap[action];
  if (!ext) {
    const actions = Object.keys(datasetMap).join(", ") || "(none)";
    throw new Error(
      `Unsupported action ${action} for "${layer}.${dataset}". Available: ${actions}`
    );
  }

  const addon = ext.parse(inputOptions) as Record<string, string>;

  return {
    ...base,
    ...addon,
  };
};
