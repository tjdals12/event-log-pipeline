import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  eventDate: string;
}): string => {
  const { silverDb, eventDate } = args;

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.int_signup_daily DROP IF EXISTS
    PARTITION (signup_date = DATE ${sql.lit(eventDate)})
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
