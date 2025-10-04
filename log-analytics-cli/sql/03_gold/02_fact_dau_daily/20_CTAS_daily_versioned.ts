import { sql } from "kysely";

import { gold } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  goldDb: string;
  bucket: string;
  metricDate: string;
  version: string;
}): string => {
  const { silverDb, goldDb, bucket, metricDate, version } = args;

  const externalLocation = `s3://${bucket}/gold/fact_dau_daily/metric_date=${metricDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(goldDb)}".fact_dau_daily__temp 
    WITH (
        format = 'PARQUET',
        parquet_compression = 'SNAPPY',
        external_location = ${sql.lit(externalLocation)}
    ) AS
    SELECT
        count(*) AS dau,
        DATE ${sql.lit(metricDate)} AS metric_date
    FROM "${sql.raw(silverDb)}".int_active_daily
    WHERE event_date = DATE ${sql.lit(metricDate)}
  `;

  const compiled = query.compile(gold).sql;

  return compiled;
};
