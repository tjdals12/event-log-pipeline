import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import * as ui from "@/jobs/ui";
import { createProgress } from "@/jobs/progress-panel";
import { createAthenaClient, QueryResult, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";

const execute = async (config: Config, args?: unknown) => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, silver } = athena;
  const { year, month, day } = args as {
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

  ui.startJob(
    {
      job,
      region,
      workgroup,
      db: silver,
      bucket,
      sqlPath: [dropPartitionSqlPath, insertDailySqlPath],
    },
    { pad: { after: 1 } }
  );

  const steps = [
    "Initialize Athena client",
    "Render SQL: Drop partition",
    "Run: Drop partition",
    "Render SQL: Insert daily",
    "Run: Insert daily",
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

    athenaClient = await progress.run(0, async () => {
      return createAthenaClient({ region });
    });

    sql = await progress.run(1, async () => {
      return renderSql(path.join(process.env.PWD!, dropPartitionSqlPath), {
        silver,
        year,
        month,
        day,
      });
    });

    const dropPartitionResult = await progress.run(2, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({
      name: "Drop partition",
      ...dropPartitionResult,
    });

    sql = await progress.run(3, async () => {
      return renderSql(path.join(process.env.PWD!, insertDailySqlPath), {
        silver,
        year,
        month,
        day,
      });
    });

    const insertDailyResult = await progress.run(4, async () => {
      return runQuery(athenaClient, sql, {
        db: silver,
        workgroup,
        bucket,
      });
    });
    results.push({
      name: "Insert daily",
      ...insertDailyResult,
    });

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
  } catch (e) {
    progress.stop();

    ui.reportJobError({ error: e, sql }, { pad: { after: 1 } });

    process.exit(1);
  }
};

export default execute;
