import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import { Emitter } from "@/jobs/event-emitter";

const execute = async (config: Config, args?: unknown): Promise<void> => {
  const startedAt = Date.now();

  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, bronze, silver } = athena;
  const { emitter, year, month, day } = args as {
    emitter?: Emitter;
    year: string;
    month: string;
    day: string;
  };
  const version = Date.now().toString();

  const job = `Daily Partition Overwrite · silver/events_clean · ${year}/${month}/${day}`;
  const createTempTableSqlPath =
    "sql/02_silver/01_events_clean/20_CTAS_daily_versioned.sql";
  const dropPartitionSqlPath =
    "sql/02_silver/01_events_clean/21_drop_partition.sql";
  const addPartitionSqlPath =
    "sql/02_silver/01_events_clean/22_add_partition.sql";
  const dropTempTableSqlPath =
    "sql/02_silver/01_events_clean/23_drop_tmp_table.sql";

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db: silver,
    bucket,
    sqlPath: [
      createTempTableSqlPath,
      dropPartitionSqlPath,
      addPartitionSqlPath,
      dropTempTableSqlPath,
    ],
  });

  const labels = [
    "Initialize Athena client",
    "Render SQL: Drop temp table if exists",
    "Run: Drop temp table if exists",
    "Render SQL: CTAS temp",
    "Run: CTAS temp",
    "Render SQL: Drop partition",
    "Run: Drop partition",
    "Render SQL: Add partition",
    "Run: Add partition",
    "Run: Drop temp table",
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
    sql = renderSql(path.join(process.env.PWD!, dropTempTableSqlPath), {
      silver,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const dropTempTableIfExistsResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({
      name: "Drop temp table if exists",
      ...dropTempTableIfExistsResult,
    });
    emitter?.emit("step:success", { index: 2 });

    emitter?.emit("step:start", { index: 3 });
    sql = renderSql(path.join(process.env.PWD!, createTempTableSqlPath), {
      bronze,
      silver,
      bucket,
      version,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 3 });

    emitter?.emit("step:start", { index: 4 });
    const createTempTableResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({ name: "CTAS temp", ...createTempTableResult });
    emitter?.emit("step:success", { index: 4 });

    emitter?.emit("step:start", { index: 5 });
    sql = renderSql(path.join(process.env.PWD!, dropPartitionSqlPath), {
      silver,
      version,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 5 });

    emitter?.emit("step:start", { index: 6 });
    const dropPartitionResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({ name: "Drop partition", ...dropPartitionResult });
    emitter?.emit("step:success", { index: 6 });

    emitter?.emit("step:start", { index: 7 });
    sql = renderSql(path.join(process.env.PWD!, addPartitionSqlPath), {
      bucket,
      silver,
      version,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 7 });

    emitter?.emit("step:start", { index: 8 });
    const addPartitionResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({ name: "Add paritition", ...addPartitionResult });
    emitter?.emit("step:success", { index: 8 });

    emitter?.emit("step:start", { index: 9 });
    sql = renderSql(path.join(process.env.PWD!, dropTempTableSqlPath), {
      silver,
      year,
      month,
      day,
    });
    emitter?.emit("step:success", { index: 9 });

    emitter?.emit("step:start", { index: 10 });
    const dropTempTableResult = await runQuery(athenaClient, sql, {
      db: silver,
      workgroup,
      bucket,
    });
    results.push({ name: "Drop temp table", ...dropTempTableResult });
    emitter?.emit("step:success", { index: 10 });

    emitter?.emit("job:report:results", { results });

    const finishedAt = Date.now();
    emitter?.emit("job:end", {
      job,
      results,
      startedAt,
      finishedAt,
    });
  } catch (e: unknown) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
