import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  year: string;
  month: string;
  day: string;
}): string => {
  const { silverDb, year, month, day } = args;

  const eventDate = [year, month, day].join("-");

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.int_active_daily DROP IF EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)})
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
