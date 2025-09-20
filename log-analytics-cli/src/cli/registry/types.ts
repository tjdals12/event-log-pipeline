import { Config } from "@/config/env";

export type Layer = "bronze" | "silver" | "gold";

export type JobHandler = (config: Config, args?: unknown) => Promise<void>;

export type DatasetEntry = Record<string, JobHandler>;

export type Registry = Record<string, DatasetEntry>;
