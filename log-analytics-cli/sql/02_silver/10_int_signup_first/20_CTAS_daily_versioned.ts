import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const externalLocation = `s3://${bucket}/silver/int_signup_first/signup_date=${eventDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(silverDb)}".int_signup_first__temp
    WITH (
        format = 'PARQUET',
        parquet_compression = 'SNAPPY',
        external_location = ${sql.lit(externalLocation)}
    ) AS
    WITH signup AS (
        SELECT
            json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id,
            event_timestamp,
            event_date
        FROM "${sql.raw(silverDb)}".events_clean
        WHERE event_date = DATE ${sql.lit(eventDate)}
        AND event_name = ${sql.lit("signup")}
        AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
    ),
    firsts AS (
        SELECT
            user_id,
            min(event_timestamp) AS signup_timestamp,
            cast(min(cast(event_date AS DATE)) AS DATE) AS signup_date
        FROM signup
        GROUP BY user_id
    )
    SELECT
        f.user_id,
        f.signup_timestamp,
        f.signup_date
    FROM firsts AS f
    LEFT JOIN "${sql.raw(
      silverDb
    )}".int_signup_first AS s ON s.user_id = f.user_id
    WHERE s.user_id IS NULL
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
