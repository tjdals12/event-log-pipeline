import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const location = `s3://${bucket}/silver/int_signup_first/signup_date=${eventDate}/v=${version}/`;

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.int_signup_first ADD IF NOT EXISTS
    PARTITION (signup_date = DATE ${sql.lit(eventDate)})
    LOCATION ${sql.lit(location)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
