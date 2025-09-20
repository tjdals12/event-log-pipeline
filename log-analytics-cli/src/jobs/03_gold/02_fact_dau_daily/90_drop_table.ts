import * as path from "path";

import { AthenaClient } from "@aws-sdk/client-athena";

import { Config } from "@/config/env";
import { createAthenaClient, runQuery } from "@/core/athena";
import { renderSql } from "@/core/sql/render-sql";
import * as ui from "@/jobs/ui";
import { createProgress } from "@/jobs/progress-panel";

const execute = async (config: Config): Promise<void> => {
  const startedAt = Date.now();

  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, gold } = athena;

  const job = "Drop Table · gold/fact_dau_daily";
  const sqlPath = "sql/03_gold/02_fact_dau_daily/90_drop_table.sql";

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
      pad: {
        after: 1,
      },
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
    athenaClient = await progress.run<AthenaClient>(0, async () => {
      return createAthenaClient({ region });
    });

    sql = await progress.run<string>(1, async () => {
      return renderSql(path.join(process.env.PWD!, sqlPath), {
        gold,
        bucket,
      });
    });

    const result = await progress.run(2, async () => {
      return runQuery(athenaClient, sql, {
        db: gold,
        workgroup,
        bucket,
      });
    });

    progress.stop();

    ui.reportJobResult(result, { pad: { after: 1 } });

    const finishedAt = Date.now();
    ui.endJob(
      { job, results: [result], startedAt, finishedAt },
      { pad: { after: 1 } }
    );
  } catch (e: unknown) {
    progress.stop();

    ui.reportJobError({ error: e, sql }, { pad: { after: 1 } });

    process.exit(1);
  }
};

export default execute;
