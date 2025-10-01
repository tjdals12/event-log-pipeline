import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
}): string => {
  const { silverDb, bucket } = args;

  const query = sql`
    CREATE EXTERNAL TABLE IF NOT EXISTS \`${sql.raw(silverDb)}\`.events_clean (
        event_uuid string,
        event_name string,
        event_params string,
        event_timestamp timestamp
    )
    PARTITIONED BY (
        event_date date
    )
    STORED AS PARQUET
    LOCATION 's3://${sql.raw(bucket)}/silver/events_clean/'
    TBLPROPERTIES (
        'parquet.compression' = 'SNAPPY'
    )
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
