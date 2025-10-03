import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { Emitter } from "@/jobs/event-emitter";
import { buildQuery as buildCreateTempTableQuery } from "@/sql/02_silver/20_int_active_daily/20_CTAS_daily_versioned";
import { buildQuery as buildDropPartitionQuery } from "@/sql/02_silver/20_int_active_daily/21_drop_partition";
import { buildQuery as buildAddPartitionQuery } from "@/sql/02_silver/20_int_active_daily/22_add_partition";
import { buildQuery as buildDropTempTableQuery } from "@/sql/02_silver/20_int_active_daily/23_drop_tmp_table";

const execute = async (config: Config, args?: unknown) => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver: silverDb } = athena;
  const { emitter, year, month, day } = args as {
    emitter?: Emitter;
    year: string;
    month: string;
    day: string;
  };
  const version = Date.now().toString();

  const eventDate = [year, month, day].join("-");

  const job = `Daily Partition Overwrite · silver/int_active_daily · ${year}/${month}/${day}`;
  const createTempTableSqlPath =
    "sql/02_silver/20_int_active_daily/20_CTAS_daily_versioned.ts";
  const dropPartitionSqlPath =
    "sql/02_silver/20_int_active_daily/21_drop_partition.ts";
  const addPartitionSqlPath =
    "sql/02_silver/20_int_active_daily/22_add_partition.ts";
  const dropTempTableSqlPath =
    "sql/02_silver/20_int_active_daily/23_drop_tmp_table.ts";

  // const query1 = buildCreateTempTableQuery({
  //   silverDb,
  //   bucket,
  //   eventDate,
  //   version,
  // });
  // console.log(query1);

  // const query2 = buildDropPartitionQuery({ silverDb, eventDate });
  // console.log(query2);

  // const query3 = buildAddPartitionQuery({
  //   silverDb,
  //   bucket,
  //   eventDate,
  //   version,
  // });
  // console.log(query3);

  // const query4 = buildDropTempTableQuery({ silverDb });
  // console.log(query4);

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
    sql = buildDropTempTableQuery({ silverDb: silverDb });
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
      bucket,
      eventDate,
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
      silverDb: silverDb,
      eventDate,
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
      silverDb: silverDb,
      bucket,
      eventDate,
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
    sql = buildDropTempTableQuery({ silverDb: silverDb });
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
