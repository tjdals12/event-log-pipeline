import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const externalLocation = `s3://${bucket}/silver/int_active_daily/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(silverDb)}".int_active_daily__temp
    WITH (
        format = 'PARQUET',
        parquet_compression = 'SNAPPY',
        external_location = ${sql.lit(externalLocation)}
    ) AS
    SELECT
        json_extract_scalar(json_parse(event_params), '$.user_id') as user_id,
        min(event_timestamp) as event_timestamp,
        cast(event_date AS DATE) as event_date
    FROM "${sql.raw(silverDb)}".events_clean
    WHERE event_name = ${sql.lit("session_start")}
    AND event_date = DATE ${sql.lit(eventDate)}
    AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
    GROUP BY
        json_extract_scalar(json_parse(event_params), '$.user_id'),
        cast(event_date AS DATE)
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
