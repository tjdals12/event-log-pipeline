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

  const cte = silver
    .withSchema(silverDb)
    .with("signup", (db) =>
      db
        .selectFrom("events_clean")
        .select([
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`.as(
            "user_id"
          ),
          "event_timestamp",
          "event_date",
        ])
        .where("event_date", "=", sql<string>`DATE ${sql.lit(eventDate)}`)
        .where("event_name", "=", sql.lit("signup"))
        .where(
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`,
          "is not",
          null
        )
    )
    .with("firsts", (db) =>
      db
        .selectFrom("signup")
        .select([
          "user_id",
          sql`min(event_timestamp)`.as("signup_timestamp"),
          sql`cast(min(cast(event_date AS DATE)) AS DATE)`.as("signup_date"),
        ])
        .groupBy("user_id")
    )
    .selectFrom("firsts")
    .select(["firsts.user_id", "firsts.signup_timestamp", "firsts.signup_date"])
    .leftJoin("int_signup_first", (join) =>
      join.onRef("int_signup_first.user_id", "=", "firsts.user_id")
    )
    .where("int_signup_first.user_id", "is", null);

  const compiled = silver
    .withSchema(silverDb)
    .insertInto("int_signup_first")
    .expression(cte)
    .compile().sql;

  return compiled;
};
