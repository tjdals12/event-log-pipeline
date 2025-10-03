import { sql } from "kysely";

import { gold } from "@/sql/database";

export const buildQuery = (args: {
  goldDb: string;
  bucket: string;
}): string => {
  const { goldDb, bucket } = args;

  const query = sql`
    CREATE EXTERNAL TABLE IF NOT EXISTS \`${sql.raw(
      goldDb
    )}\`.fact_retention_daily (
        cohort_date date,
        day_n integer,
        cohort_size bigint,
        retained_users bigint,
        retention_rate double
    )
    PARTITIONED BY (
        metric_date date
    )
    STORED AS PARQUET 
    LOCATION 's3://${sql.raw(bucket)}/gold/fact_retention_daily/'
    TBLPROPERTIES (
        'parquet.compression' = 'SNAPPY'
    )
  `;

  const compiled = query.compile(gold).sql;

  return compiled;
};
