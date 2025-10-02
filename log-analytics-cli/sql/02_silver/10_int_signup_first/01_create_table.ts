import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
}): string => {
  const { silverDb, bucket } = args;

  const query = sql`
    CREATE EXTERNAL TABLE IF NOT EXISTS \`${sql.raw(
      silverDb
    )}\`.int_signup_first (
        user_id string,
        signup_timestamp timestamp
    )
    PARTITIONED BY (
        signup_date date
    )
    STORED AS PARQUET
    LOCATION 's3://${sql.raw(bucket)}/silver/int_signup_first/'
    TBLPROPERTIES (
        'parquet.compression' = 'SNAPPY'
    )
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
