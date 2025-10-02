import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  silverDb: string;
  year: string;
  month: string;
  day: string;
}): string => {
  const { silverDb, year, month, day } = args;

  const signUpDate = [year, month, day].join("-");

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.int_signup_first DROP IF EXISTS
    PARTITION (signup_date = DATE ${sql.lit(signUpDate)})
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
