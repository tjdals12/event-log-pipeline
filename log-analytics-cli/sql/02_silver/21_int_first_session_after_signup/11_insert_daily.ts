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
    .with("cohort", (db) =>
      db
        .selectFrom("int_signup_first")
        .select(["user_id", "signup_timestamp", "signup_date"])
    )
    .with("sessions", (db) =>
      db
        .selectFrom("events_clean")
        .select([
          sql`event_timestamp`.as("session_timestamp"),
          sql`event_date`.as("session_date"),
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`.as(
            "user_id"
          ),
        ])
        .where("event_name", "=", sql.lit("session_start"))
        .where(
          sql`json_extract_scalar(json_parse(event_params), '$.user_id')`,
          "is not",
          null
        )
        .where("event_date", "<=", sql<string>`DATE ${sql.lit(eventDate)}`)
    )
    .with("first_after", (db) =>
      db
        .selectFrom("cohort")
        .select([
          "cohort.user_id",
          sql`min(sessions.session_timestamp)`.as("first_session_timestamp"),
          sql`min_by(sessions.session_date, sessions.session_timestamp)`.as(
            "first_session_date"
          ),
        ])
        .innerJoin("sessions", (join) =>
          join
            .onRef("cohort.user_id", "=", "sessions.user_id")
            .onRef("cohort.signup_timestamp", "<=", "session_timestamp")
        )
        .groupBy("cohort.user_id")
    )
    .selectFrom("first_after as fa")
    .innerJoin("cohort as c", (join) =>
      join.onRef("c.user_id", "=", "fa.user_id")
    )
    .select([
      "c.user_id",
      "c.signup_timestamp",
      sql`cast(c.signup_date AS DATE)`.as("signup_date"),
      "fa.first_session_timestamp",
      sql`cast(fa.first_session_date AS DATE)`.as("first_session_date"),
      sql`cast(fa.first_session_date AS DATE)`.as("event_date"),
    ])
    .where(
      sql`cast(fa.first_session_date AS DATE)`,
      "=",
      sql<string>`DATE ${sql.lit(eventDate)}`
    );

  const compiled = silver
    .withSchema(silverDb)
    .insertInto("int_first_session_after_signup")
    .expression(cte)
    .compile().sql;

  return compiled;
};
