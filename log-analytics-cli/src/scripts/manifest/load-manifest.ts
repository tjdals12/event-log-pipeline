import * as fs from "fs";
import * as yaml from "yaml";
import { z } from "zod";

import { Manifest, ManifestSchema } from "./manifest.schema";

export const loadManifest = (path: string): Manifest => {
  if (!fs.existsSync(path)) throw new Error(`Manifest file not found: ${path}`);

  const text = fs.readFileSync(path, "utf-8");
  const parsed = yaml.parse(text);

  const { error, data: manifest } = ManifestSchema.safeParse(parsed);
  if (error) {
    const message = z.treeifyError(error).errors.join(",");
    throw new Error(message);
  }

  return manifest;
};
