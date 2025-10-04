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
    )}\`.int_first_session_after_signup (
        user_id string,
        signup_timestamp timestamp,
        signup_date date,
        first_session_timestamp timestamp,
        first_session_date date,
        days_to_first_session int
    )
    PARTITIONED BY (
        event_date date
    )
    STORED AS PARQUET 
    LOCATION 's3://${sql.raw(bucket)}/silver/int_first_session_after_signup'
    TBLPROPERTIES (
        'parquet.compression' = 'SNAPPY'
    )
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
