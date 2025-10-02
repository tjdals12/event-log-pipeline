import { sql } from "kysely";

import { bronze, silver } from "@/sql/database";

export const buildQuery = (args: {
  bronzeDb: string;
  silverDb: string;
  year: string;
  month: string;
}): string => {
  const { bronzeDb, silverDb, year, month } = args;

  const compiled = silver
    .withSchema(silverDb)
    .insertInto("events_clean")
    .expression(
      bronze
        .withSchema(bronzeDb)
        .selectFrom("events_raw")
        .select([
          "event_uuid",
          "event_name",
          "event_params",
          sql`cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'utc') AS timestamp)`.as(
            "event_timestamp"
          ),
          sql`date(cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'UTC') AS timestamp))`.as(
            "event_date"
          ),
        ])
        .where("year", "=", sql.lit(year))
        .where("month", "=", sql.lit(month))
    )
    .compile().sql;

  return compiled;
};
