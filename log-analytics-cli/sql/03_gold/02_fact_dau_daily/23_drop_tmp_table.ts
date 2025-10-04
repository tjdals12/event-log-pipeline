import { gold } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: { goldDb: string }): string => {
  const { goldDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(
    goldDb
  )}\`.fact_dau_daily__temp`;

  const compiled = query.compile(gold).sql;

  return compiled;
};
