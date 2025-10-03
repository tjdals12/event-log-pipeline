import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  eventDate: string;
  version: string;
}): string => {
  const { silverDb, bucket, eventDate, version } = args;

  const location = `s3://${bucket}/silver/int_active_daily/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.int_active_daily ADD IF NOT EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)})
    LOCATION ${sql.lit(location)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
