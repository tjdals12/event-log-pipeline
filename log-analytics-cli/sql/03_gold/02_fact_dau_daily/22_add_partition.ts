import { gold } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  goldDb: string;
  bucket: string;
  metricDate: string;
  version: string;
}): string => {
  const { goldDb, bucket, metricDate, version } = args;

  const location = `s3://${bucket}/gold/fact_dau_daily/metric_date=${metricDate}/v=${version}/`;

  const query = sql`
    ALTER TABLE \`${sql.raw(goldDb)}\`.fact_dau_daily ADD IF NOT EXISTS
    PARTITION (metric_date = DATE ${sql.lit(metricDate)})
    LOCATION ${sql.lit(location)}
  `;

  const compiled = query.compile(gold).sql;

  return compiled;
};
