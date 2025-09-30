import * as path from "path";
import * as moment from "moment-timezone";

import { loadExecutionOrder } from "../manifest";
import { loadConfig } from "@/config/env";
import { resolveJob } from "@/registry";
import { JobHandler } from "@/registry/types";
import { ActionsLogger } from "@/jobs/actions-logger";

const main = async (manifestPath: string) => {
  try {
    const stage = process.env.STAGE;
    if (!stage)
      throw new Error(`Invalid stage '${stage}'. Allowed: dev, prod.`);

    const actionsLogger = new ActionsLogger();

    const config = loadConfig(stage);

    const order = loadExecutionOrder(manifestPath);

    const handlers: JobHandler[] = [];

    for (const dataset of order) {
      const { layer, table } = dataset;

      const handler = resolveJob({
        layer,
        dataset: table,
        action: "overwrite-daily",
      });

      handlers.push(handler);
    }

    const date = moment.utc().subtract(1, "days").format("YYYY-MM-DD");
    const [year, month, day] = date.split("-");

    for (const handler of handlers) {
      await handler(config, { emitter: actionsLogger, year, month, day });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(message);
  }
};

void main(path.resolve(__dirname, "manifest.yml"));
