import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import { Emitter } from "@/jobs/event-emitter";
import { buildQuery } from "@/sql/02_silver/10_int_signup_first/90_drop_table";

const execute = async (config: Config, args: unknown): Promise<void> => {
  const startedAt = Date.now();

  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver: silverDb } = athena;
  const { emitter } = args as { emitter?: Emitter };

  const job = "Drop Table · silver/int_signup_first";
  const sqlPath = "sql/02_silver/10_int_signup_first/90_drop_table.sql";

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db: silverDb,
    bucket,
    sqlPath,
  });

  const labels = [
    "Initialize Athena client",
    "Render SQL template",
    "Run query",
  ];
  emitter?.emit("step:initialize", { labels });

  let athenaClient: AthenaClient;
  let sql: string = "";

  try {
    emitter?.emit("step:start", { index: 0 });
    athenaClient = createAthenaClient({ region });
    emitter?.emit("step:success", { index: 0 });

    emitter?.emit("step:start", { index: 1 });
    sql = buildQuery({ silverDb });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const result = await runQuery(athenaClient, sql, {
      db: silverDb,
      workgroup,
      bucket,
    });
    emitter?.emit("step:start", { index: 2 });

    emitter?.emit("job:report:result", { result });

    const finishedAt = Date.now();
    emitter?.emit("job:end", {
      job,
      results: [result],
      startedAt,
      finishedAt,
    });
  } catch (e: unknown) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
