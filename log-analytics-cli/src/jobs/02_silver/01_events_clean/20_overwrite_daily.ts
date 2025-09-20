import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import * as ui from "@/jobs/ui";
import { createProgress } from "@/jobs/progress-panel";

const execute = async (config: Config, args?: unknown): Promise<void> => {
  const startedAt = Date.now();

  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, bronze, silver } = athena;
  const { year, month, day } = args as {
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

  ui.startJob(
    {
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
    },
    { pad: { after: 1 } }
  );

  const steps = [
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
  const progress = createProgress(steps, {
    title: "PROGRESS",
    pad: {
      after: 1,
    },
  });
  progress.start();

  let athenaClient: AthenaClient;
  let sql: string = "";

  try {
    const results: ({ name: string } & QueryResult)[] = [];

    athenaClient = await progress.run<AthenaClient>(0, async () => {
      return createAthenaClient({ region });
    });

    sql = await progress.run<string>(1, async () => {
      return renderSql(path.join(process.env.PWD!, dropTempTableSqlPath), {
        silver,
        year,
        month,
        day,
      });
    });
    const dropTempTableIfExistsResult = await progress.run(2, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({
      name: "Drop temp table if exists",
      ...dropTempTableIfExistsResult,
    });

    sql = await progress.run<string>(3, async () => {
      return renderSql(path.join(process.env.PWD!, createTempTableSqlPath), {
        bronze,
        silver,
        bucket,
        version,
        year,
        month,
        day,
      });
    });
    const createTempTableResult = await progress.run(4, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({ name: "CTAS temp", ...createTempTableResult });

    sql = await progress.run<string>(5, async () => {
      return renderSql(path.join(process.env.PWD!, dropPartitionSqlPath), {
        silver,
        version,
        year,
        month,
        day,
      });
    });
    const dropPartitionResult = await progress.run(6, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({ name: "Drop partition", ...dropPartitionResult });

    sql = await progress.run<string>(7, async () => {
      return renderSql(path.join(process.env.PWD!, addPartitionSqlPath), {
        bucket,
        silver,
        version,
        year,
        month,
        day,
      });
    });
    const addPartitionResult = await progress.run(8, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({ name: "Add paritition", ...addPartitionResult });

    sql = await progress.run<string>(1, async () => {
      return renderSql(path.join(process.env.PWD!, dropTempTableSqlPath), {
        silver,
        year,
        month,
        day,
      });
    });
    const dropTempTableResult = await progress.run(9, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({ name: "Drop temp table", ...dropTempTableResult });

    progress.stop();

    ui.reportJobResults(results, { pad: { after: 1 } });

    const finishedAt = Date.now();
    ui.endJob(
      {
        job,
        results,
        startedAt,
        finishedAt,
      },
      { pad: { after: 1 } }
    );
  } catch (e: unknown) {
    progress.stop();

    ui.reportJobError({ error: e, sql }, { pad: { after: 1 } });

    process.exit(1);
  }
};

export default execute;
