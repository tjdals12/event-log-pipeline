import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  year: string;
  month: string;
  day: string;
}): string => {
  const { silverDb, year, month, day } = args;

  const eventDate = [year, month, day].join("-");

  const compiled = silver
    .withSchema(silverDb)
    .insertInto("int_signup_daily")
    .expression(
      silver
        .withSchema(silverDb)
        .selectFrom("events_clean")
        .select([
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`.as(
            "user_id"
          ),
          sql`cast(event_date AS DATE)`.as("signup_date"),
        ])
        .distinct()
        .where("event_name", "=", sql.lit("signup"))
        .where(
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`,
          "is not",
          null
        )
        .where("event_date", "=", sql<string>`DATE ${sql.lit(eventDate)}`)
    )
    .compile().sql;

  return compiled;
};
