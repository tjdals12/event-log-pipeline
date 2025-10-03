import { sql } from "kysely";

import { gold } from "@/sql/database";

export const buildQuery = (args: { goldDb: string }): string => {
  const { goldDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(
    goldDb
  )}\`.fact_retention_daily`;

  const compiled = query.compile(gold).sql;

  return compiled;
};
