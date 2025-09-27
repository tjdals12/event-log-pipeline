import { Config } from "@/config/env";

export const LAYERS = ["bronze", "silver", "gold"] as const;

export type Layer = (typeof LAYERS)[number];

export type JobHandler = (config: Config, args?: unknown) => Promise<void>;

export type DatasetEntry = Record<string, JobHandler>;

export type Registry = Record<string, DatasetEntry>;
