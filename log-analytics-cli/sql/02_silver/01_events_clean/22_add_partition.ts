import { silver } from "@/sql/database";
import { sql } from "kysely";

export const buildQuery = (args: {
  silverDb: string;
  bucket: string;
  year: string;
  month: string;
  day: string;
  version: string;
}) => {
  const { silverDb, bucket, year, month, day, version } = args;

  const eventDate = [year, month, day].join("-");

  const location = `s3://${bucket}/silver/events_clean/event_date=${eventDate}/v=${version}/`;

  const query = sql`
    ALTER TABLE \`${sql.raw(silverDb)}\`.events_clean ADD IF NOT EXISTS
    PARTITION (event_date = DATE ${sql.lit(eventDate)})
    LOCATION ${sql.lit(location)}
  `;

  const compiled = query.compile(silver).sql;

  return compiled;
};
