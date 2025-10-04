import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const externalLocation = `s3://${bucket}/silver/int_first_session_after_signup/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(silverDb)}".int_first_session_after_signup__temp
    WITH (
        format = 'PARQUET',
        parquet_compression = 'SNAPPY',
        external_location = ${sql.lit(externalLocation)}
    ) AS
    WITH cohort AS (
      SELECT
        user_id,
        signup_timestamp,
        signup_date
      FROM int_signup_first
    ),
    sessions AS (
      SELECT
        event_timestamp AS session_timestamp,
        event_date  AS session_date,
        json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id
      FROM "${sql.raw(silverDb)}".events_clean
      WHERE event_name = ${sql.lit("session_start")}
      AND event_date <= DATE ${sql.lit(eventDate)}
      AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
    ),
    first_after AS (
      SELECT
        c.user_id,
        min(s.session_timestamp) AS first_session_timestamp,
        min_by(s.session_date, s.session_timestamp) AS first_session_date
      FROM cohort AS c
      INNER JOIN sessions AS s ON c.user_id = s.user_id AND c.signup_timestamp <= s.session_timestamp
      GROUP BY c.user_id
    )
    SELECT
      c.user_id,
      c.signup_timestamp,
      cast(c.signup_date AS DATE) AS signup_date,
      first_session_timestamp,
      cast(first_session_date AS DATE) AS first_session_date,
      greatest(date_diff('day', cast(c.signup_date AS DATE), cast(fa.first_session_date AS DATE)), 0) AS days_to_first_session,
      cast(first_session_date AS DATE) AS event_date
    FROM first_after AS fa
    INNER JOIN cohort AS c ON c.user_id = fa.user_id
    WHERE cast(first_session_date AS DATE) = DATE ${sql.lit(eventDate)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
