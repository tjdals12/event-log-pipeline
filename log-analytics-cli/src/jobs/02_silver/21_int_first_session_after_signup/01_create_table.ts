import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import { Emitter } from "@/jobs/event-emitter";

const execute = async (config: Config, args: unknown) => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver } = athena;
  const { emitter } = args as { emitter?: Emitter };

  const job = "Create Table · silver/int_first_session_after_signup";
  const sqlPath =
    "sql/02_silver/21_int_first_session_after_signup/01_create_table.sql";

  const startedAt = Date.now();

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db: silver,
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
    sql = renderSql(path.join(process.env.PWD!, sqlPath), {
      silver,
      bucket,
    });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const result = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    emitter?.emit("step:success", { index: 2 });

    emitter?.emit("job:report:result", { result });

    const finishedAt = Date.now();
    emitter?.emit("job:end", {
      job,
      results: [result],
      startedAt,
      finishedAt,
    });
  } catch (e) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
