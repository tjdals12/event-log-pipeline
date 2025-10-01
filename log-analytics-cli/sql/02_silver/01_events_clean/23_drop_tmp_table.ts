import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: { silverDb: string }) => {
  const { silverDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(
    silverDb
  )}\`.events_clean__temp`;

  const compiled = query.compile(silver).sql;

  return compiled;
};
