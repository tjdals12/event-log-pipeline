import { sql } from "kysely";

import { bronze } from "@/sql/database";

export const buildQuery = (args: { bronzeDb: string }): string => {
  const { bronzeDb } = args;

  const query = sql`DROP TABLE IF EXISTS \`${sql.raw(bronzeDb)}\`.events_raw`;

  const compiled = query.compile(bronze).sql;

  return compiled;
};
