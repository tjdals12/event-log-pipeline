import { sql } from "kysely";

import { silver } from "@/sql/database";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const location = `s3://${bucket}/silver/int_first_session_after_signup/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    ALTER TABLE \`${sql.raw(
      silverDb
    )}\`.int_first_session_after_signup ADD IF NOT EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)})
    LOCATION ${sql.lit(location)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
