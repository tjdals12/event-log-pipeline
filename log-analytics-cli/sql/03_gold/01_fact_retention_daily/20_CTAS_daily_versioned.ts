import { sql } from "kysely";

import { gold } from "@/sql/database";

export const builldQuery = (args: {
  silverDb: string;
  goldDb: string;
  bucket: string;
  metricDate: string;
  version: string;
}): string => {
  const { silverDb, goldDb, bucket, metricDate, version } = args;

  const externalLocation = `s3://${bucket}/gold/fact_retention_daily/metric_date=${metricDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(goldDb)}".fact_retention_daily__temp
    WITH (
        format = 'PARQUET',
        parquet_compression = 'SNAPPY',
        external_location = ${sql.lit(externalLocation)}
    ) AS
    WITH active AS (
        SELECT
            user_id
        FROM "${sql.raw(silverDb)}".int_active_daily
        WHERE event_date = DATE ${sql.lit(metricDate)}
    ),
    retained AS (
        SELECT
            s.signup_date AS cohort_date,
            date_diff('day', s.signup_date, date ${sql.lit(
              metricDate
            )}) AS day_n,
            a.user_id AS user_id
        FROM "${sql.raw(silverDb)}".int_signup_first AS s
        INNER JOIN active AS a ON a.user_id = s.user_id
        WHERE s.signup_date <= DATE ${sql.lit(metricDate)}
    ),
    retained_agg AS (
        SELECT
            cohort_date,
            day_n,
            count(distinct user_id) AS retained_users
        FROM retained
        GROUP BY cohort_date, day_n
    ),
    cohort_size AS (
        SELECT
            signup_date AS cohort_date,
            count(*) AS cohort_size
        FROM "${sql.raw(silverDb)}".int_signup_first
        WHERE signup_date <= DATE ${sql.lit(metricDate)}
        GROUP BY signup_date
    )
    SELECT
        ra.cohort_date,
        ra.day_n,
        cs.cohort_size,
        ra.retained_users,
        cast(ra.retained_users * 1.0 / nullif(cs.cohort_size, 0) AS DOUBLE) AS retention_rate,
        DATE ${sql.lit(metricDate)} AS metric_date
    FROM retained_agg as ra
    INNER JOIN cohort_size AS cs ON cs.cohort_date = ra.cohort_date
  `;

  const compiled = query.compile(gold).sql;

  return compiled;
};
