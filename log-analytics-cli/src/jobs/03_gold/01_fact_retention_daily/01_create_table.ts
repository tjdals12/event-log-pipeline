import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { createAthenaClient, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import { Config } from "@/config/env";
import * as ui from "@/jobs/ui";
import { createProgress } from "@/jobs/progress-panel";

const execute = async (config: Config): Promise<void> => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, gold } = athena;

  const job = "Create Table · gold/fact_retention_daily";
  const sqlPath = "sql/03_gold/01_fact_retention_daily/01_create_table.sql";

  const startedAt = Date.now();

  ui.startJob(
    {
      job,
      region,
      workgroup,
      db: gold,
      bucket,
      sqlPath,
    },
    {
      pad: { after: 1 },
    }
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
    athenaClient = await progress.run(0, async () => {
      return createAthenaClient({ region });
    });

    sql = await progress.run(1, async () => {
      return renderSql(path.join(process.env.PWD!, sqlPath), { gold, bucket });
    });

    const result = await progress.run(2, async () => {
      return runQuery(athenaClient, sql, {
        db: gold,
        workgroup,
        bucket,
      });
    });

    progress.stop();

    ui.reportJobResult(result, {
      pad: {
        after: 1,
      },
    });

    const finishedAt = Date.now();
    ui.endJob(
      {
        job,
        results: [result],
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
