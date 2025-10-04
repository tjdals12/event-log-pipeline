import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  eventDate: string;
}): string => {
  const { silverDb, eventDate } = args;

  const query = sql`
    ALTER TABLE \`${sql.raw(
      silverDb
    )}\`.int_first_session_after_signup DROP IF EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)});
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
