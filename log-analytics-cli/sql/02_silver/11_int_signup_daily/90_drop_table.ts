import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: { silverDb: string }): string => {
  const { silverDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(
    silverDb
  )}\`.int_signup_daily`;

  const compiled = query.compile(silver).sql;

  return compiled;
};
