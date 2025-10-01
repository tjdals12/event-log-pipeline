import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  bronzeDb: string;
  silverDb: string;
  bucket: string;
  year: string;
  month: string;
  day: string;
  version: string;
}): string => {
  const { bronzeDb, silverDb, bucket, year, month, day, version } = args;

  const eventDate = [year, month, day].join("-");

  const externalLocation = `s3://${bucket}/silver/events_clean/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    CREATE TABLE "${sql.raw(silverDb)}".events_clean__temp
    WITH (
      format = 'PARQUET', 
      parquet_compression = 'SNAPPY', 
      external_location = ${sql.lit(externalLocation)} 
    ) AS
    SELECT
      event_uuid,
      event_name,
      event_params,
      cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'utc') AS timestamp) AS event_timestamp,
      date(cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'UTC') AS timestamp)) AS event_date
    FROM "${sql.raw(bronzeDb)}".events_raw
    WHERE year = ${sql.lit(year)}
    AND month = ${sql.lit(month)}
    AND day = ${sql.lit(day)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
