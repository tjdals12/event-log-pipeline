import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import { Emitter } from "@/jobs/event-emitter";

const execute = async (config: Config, args?: unknown) => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver } = athena;
  const { emitter, year, month, day } = args as {
    emitter?: Emitter;
    year: string;
    month: string;
    day: string;
  };

  const job = `Daily Partition Overwrite · silver/int_signup_daily · ${year}/${month}/${day}`;
  const dropPartitionSqlPath =
    "sql/02_silver/11_int_signup_daily/10_drop_partition.sql";
  const insertDailySqlPath =
    "sql/02_silver/11_int_signup_daily/11_insert_daily.sql";

  const startedAt = Date.now();

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db: silver,
    bucket,
    sqlPath: [dropPartitionSqlPath, insertDailySqlPath],
  });

  const labels = [
    "Initialize Athena client",
    "Render SQL: Drop partition",
    "Run: Drop partition",
    "Render SQL: Insert daily",
    "Run: Insert daily",
  ];
  emitter?.emit("step:initialize", { labels });

  let athenaClient: AthenaClient;
  let sql: string = "";

  try {
    const results: ({ name: string } & QueryResult)[] = [];

    emitter?.emit("step:start", { index: 0 });
    athenaClient = createAthenaClient({ region });
    emitter?.emit("step:success", { index: 0 });

    emitter?.emit("step:start", { index: 1 });
    sql = renderSql(path.join(process.env.PWD!, dropPartitionSqlPath), {
      silver,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const dropPartitionResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({
      name: "Drop partition",
      ...dropPartitionResult,
    });
    emitter?.emit("step:success", { index: 2 });

    emitter?.emit("step:start", { index: 3 });
    sql = renderSql(path.join(process.env.PWD!, insertDailySqlPath), {
      silver,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 3 });

    emitter?.emit("step:start", { index: 4 });
    const insertDailyResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({
      name: "Insert daily",
      ...insertDailyResult,
    });
    emitter?.emit("step:success", { index: 4 });

    emitter?.emit("job:report:results", { results });

    const finishedAt = Date.now();
    emitter?.emit("job:end", {
      job,
      results,
      startedAt,
      finishedAt,
    });
  } catch (e) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
