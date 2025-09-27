import { z } from "zod";

export const TaskSchema = z.object({
  dataset: z.string(),
  dependsOn: z.array(z.string()).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const ManifestSchema = z.object({
  version: z.string(),
  tasks: z.array(TaskSchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;
