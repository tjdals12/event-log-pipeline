import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  silverDb: string;
  year: string;
  month: string;
  day: string;
}): string => {
  const { silverDb, year, month, day } = args;

  const eventDate = [year, month, day].join("-");

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.events_clean DROP IF EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)})
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
