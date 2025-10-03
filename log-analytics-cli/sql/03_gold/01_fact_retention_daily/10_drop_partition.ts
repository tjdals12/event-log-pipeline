import { sql } from "kysely";

import { gold } from "@/sql/database";

export const buildQuery = (args: {
  goldDb: string;
  metricDate: string;
}): string => {
  const { goldDb, metricDate } = args;

  const query = sql`
    ALTER TABLE \`${sql.raw(goldDb)}\`.fact_retention_daily DROP IF EXISTS
    PARTITION (metric_date = DATE ${sql.lit(metricDate)})
  `;

  const compiled = query.compile(gold).sql;

  return compiled;
};
