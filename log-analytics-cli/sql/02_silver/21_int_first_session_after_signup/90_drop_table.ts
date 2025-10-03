import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: { silverDb: string }): string => {
  const { silverDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(
    silverDb
  )}\`.int_first_session_after_signup`;

  const compiled = query.compile(silver).sql;

  return compiled;
};
