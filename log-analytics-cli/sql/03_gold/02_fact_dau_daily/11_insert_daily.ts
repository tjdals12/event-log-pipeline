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
    .selectFrom("int_active_daily")
    .select([
      sql`count(*)`.as("dau"),
      sql`DATE ${sql.lit(metricDate)}`.as("metric_date"),
    ])
    .where("event_date", "=", sql<string>`DATE ${sql.lit(metricDate)}`);

  const compiled = gold
    .withSchema(goldDb)
    .insertInto("fact_dau_daily")
    .expression(cte)
    .compile().sql;

  return compiled;
};
