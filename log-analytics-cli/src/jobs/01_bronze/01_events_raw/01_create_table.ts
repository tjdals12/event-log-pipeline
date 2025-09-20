import * as path from "path";

import { Config } from "@/config/env";
import * as ui from "@/jobs/ui";
import { createProgress } from "@/jobs/progress-panel";
import { AthenaClient } from "@aws-sdk/client-athena";
import { createAthenaClient, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";

const execute = async (config: Config): Promise<void> => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, bronze: db } = athena;

  const job = "Create Table · bronze/events_raw";
  const sqlPath = "sql/01_bronze/01_events_raw/01_create_table.sql";

  const startedAt = Date.now();

  ui.startJob(
    {
      job,
      region,
      workgroup,
      db,
      bucket,
      sqlPath,
    },
    { pad: { after: 1 } }
  );

  const steps = [
    "Initialize Athena client",
    "Render SQL template",
    "Run query",
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
    athenaClient = await progress.run<AthenaClient>(0, async () => {
      return createAthenaClient({ region });
    });

    sql = await progress.run(1, async () => {
      return renderSql(path.join(process.env.PWD!, sqlPath), {
        db,
        bucket,
      });
    });

    const result = await progress.run(2, async () => {
      return runQuery(athenaClient, sql, {
        db,
        workgroup,
        bucket,
      });
    });

    progress.stop();

    ui.reportJobResult(result, { pad: { after: 1 } });

    const finishedAt = Date.now();
    ui.endJob({
      job,
      results: [result],
      startedAt,
      finishedAt,
    });
  } catch (e: unknown) {
    progress.stop();

    ui.reportJobError(
      {
        error: e,
        sql,
      },
      { pad: { after: 1 } }
    );

    process.exit(1);
  }
};

export default execute;
