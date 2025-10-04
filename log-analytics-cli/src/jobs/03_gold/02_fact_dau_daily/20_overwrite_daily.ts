import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { Emitter } from "@/jobs/event-emitter";
import { buildQuery as buildCreateTempTableQuery } from "@/sql/03_gold/02_fact_dau_daily/20_CTAS_daily_versioned";
import { buildQuery as buildDropPartitionQuery } from "@/sql/03_gold/02_fact_dau_daily/21_drop_partition";
import { buildQuery as buildAddPartitionQuery } from "@/sql/03_gold/02_fact_dau_daily/22_add_partition";
import { buildQuery as buildDropTempTableQuery } from "@/sql/03_gold/02_fact_dau_daily/23_drop_tmp_table";

const execute = async (config: Config, args?: unknown) => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver: silverDb, gold: goldDb } = athena;
  const { emitter, year, month, day } = args as {
    emitter?: Emitter;
    year: string;
    month: string;
    day: string;
  };
  const version = Date.now().toString();

  const metricDate = [year, month, day].join("-");

  const job = `Daily Partition Overwrite · gold/fact_dau_daily · ${year}/${month}/${day}`;
  const createTempTableSqlPath =
    "sql/03_gold/02_fact_dau_daily/20_CTAS_daily_versioned.ts";
  const dropPartitionSqlPath =
    "sql/03_gold/02_fact_dau_daily/21_drop_partition.ts";
  const addPartitionSqlPath =
    "sql/03_gold/02_fact_dau_daily/22_add_partition.ts";
  const dropTempTableSqlPath =
    "sql/03_gold/02_fact_dau_daily/23_drop_tmp_table.ts";

  const startedAt = Date.now();

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db: silverDb,
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
    sql = buildDropTempTableQuery({ goldDb: goldDb });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const dropTempTableIfExistsResult = await runQuery(athenaClient, sql, {
      db: silverDb,
      workgroup,
      bucket,
    });
    results.push({
      name: "Drop temp table if exists",
      ...dropTempTableIfExistsResult,
    });
    emitter?.emit("step:success", { index: 2 });

    emitter?.emit("step:start", { index: 3 });
    sql = buildCreateTempTableQuery({
      silverDb: silverDb,
      goldDb,
      bucket,
      metricDate,
      version,
    });
    emitter?.emit("step:success", { index: 3 });

    emitter?.emit("step:start", { index: 4 });
    const createTempTableResult = await runQuery(athenaClient, sql, {
      db: silverDb,
      workgroup,
      bucket,
    });
    results.push({ name: "CTAS temp", ...createTempTableResult });
    emitter?.emit("step:success", { index: 4 });

    emitter?.emit("step:start", { index: 5 });
    sql = buildDropPartitionQuery({
      goldDb,
      metricDate,
    });
    emitter?.emit("step:success", { index: 5 });

    emitter?.emit("step:start", { index: 6 });
    const dropPartitionResult = await runQuery(athenaClient, sql, {
      db: silverDb,
      workgroup,
      bucket,
    });
    results.push({ name: "Drop partition", ...dropPartitionResult });
    emitter?.emit("step:success", { index: 6 });

    emitter?.emit("step:start", { index: 7 });
    sql = buildAddPartitionQuery({
      goldDb,
      bucket,
      metricDate,
      version,
    });
    emitter?.emit("step:success", { index: 7 });

    emitter?.emit("step:start", { index: 8 });
    const addPartitionResult = await runQuery(athenaClient, sql, {
      db: silverDb,
      workgroup,
      bucket,
    });
    results.push({ name: "Add paritition", ...addPartitionResult });
    emitter?.emit("step:success", { index: 8 });

    emitter?.emit("step:start", { index: 9 });
    sql = buildDropTempTableQuery({ goldDb });
    emitter?.emit("step:success", { index: 9 });

    emitter?.emit("step:start", { index: 10 });
    const dropTempTableResult = await runQuery(athenaClient, sql, {
      db: silverDb,
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
  } catch (e) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
