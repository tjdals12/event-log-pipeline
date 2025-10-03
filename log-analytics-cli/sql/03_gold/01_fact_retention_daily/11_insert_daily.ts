import { sql } from "kysely";

import { gold, silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  goldDb: string;
  metricDate: string;
}): string => {
  const { silverDb, goldDb, metricDate } = args;

  const cte = silver
    .withSchema(silverDb)
    .with("active", (db) =>
      db
        .selectFrom("int_active_daily")
        .select("user_id")
        .where("event_date", "=", sql<string>`DATE ${sql.lit(metricDate)}`)
    )
    .with("retained", (db) =>
      db
        .selectFrom("int_signup_first as s")
        .innerJoin("active as a", (join) =>
          join.onRef("s.user_id", "=", "a.user_id")
        )
        .select([
          sql`s.signup_date`.as("cohort_date"),
          sql`date_diff('day', s.signup_date, date ${sql.lit(metricDate)})`.as(
            "day_n"
          ),
          "a.user_id",
        ])
        .where("s.signup_date", "<=", sql<string>`DATE ${sql.lit(metricDate)}`)
    )
    .with("retained_agg", (db) =>
      db
        .selectFrom("retained")
        .groupBy(["cohort_date", "day_n"])
        .select([
          "cohort_date",
          "day_n",
          sql`count(distinct user_id)`.as("retained_users"),
        ])
    )
    .with("cohort_size", (db) =>
      db
        .selectFrom("int_signup_first")
        .where("signup_date", "<=", sql<string>`DATE ${sql.lit(metricDate)}`)
        .groupBy("signup_date")
        .select([
          sql`signup_date`.as("cohort_date"),
          sql`count(*)`.as("cohort_size"),
        ])
    )
    .selectFrom("retained_agg as r")
    .innerJoin("cohort_size as cs", (join) =>
      join.onRef("r.cohort_date", "=", "cs.cohort_date")
    )
    .select([
      "r.cohort_date",
      "r.day_n",
      "cs.cohort_size",
      "r.retained_users",
      sql`cast(r.retained_users * 1.0 / nullif(cs.cohort_size, 0) as double)`.as(
        "retention_date"
      ),
      sql`date ${sql.lit(metricDate)}`.as("metric_date"),
    ]);

  const compiled = gold
    .withSchema(goldDb)
    .insertInto("fact_retention_daily")
    .expression(cte)
    .compile().sql;

  return compiled;
};
