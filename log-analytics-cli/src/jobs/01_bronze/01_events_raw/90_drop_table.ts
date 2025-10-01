import { Config } from "@/config/env";
import { AthenaClient } from "@aws-sdk/client-athena";
import { createAthenaClient, runQuery } from "@/core/athena";
import { Emitter } from "@/jobs/event-emitter";
import { buildQuery } from "@/sql/01_bronze/01_events_raw/90_drop_table";

const execute = async (config: Config, args: unknown): Promise<void> => {
  const { aws } = config;
  const { region, bucket, athena } = aws;
  const { workgroup, bronze: db } = athena;
  const { emitter } = args as { emitter?: Emitter };

  const job = "Drop Table · bronze/events_raw";
  const sqlPath = "sql/01_bronze/01_events_raw/90_drop_table.ts";

  const startedAt = Date.now();

  emitter?.emit("job:start", {
    job,
    region,
    workgroup,
    db,
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
    sql = buildQuery({ bronzeDb: db });
    emitter?.emit("step:success", { index: 1 });

    emitter?.emit("step:start", { index: 2 });
    const result = await runQuery(athenaClient, sql, { db, workgroup, bucket });
    emitter?.emit("step:success", { index: 2 });

    emitter?.emit("job:report:result", { result });

    const finishedAt = Date.now();
    emitter?.emit("job:end", {
      job,
      results: [result],
      startedAt,
      finishedAt,
    });
  } catch (e: unknown) {
    emitter?.emit("job:error", { error: e, sql });

    process.exit(1);
  }
};

export default execute;
