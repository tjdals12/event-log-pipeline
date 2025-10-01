import { SqliteDialect, Kysely } from "kysely";
import SQLite from "better-sqlite3";

import { SilverDatabase } from "../types/tables/02_silver";

const dialect = new SqliteDialect({
  database: new SQLite(":memory:"),
});

const silver = new Kysely<SilverDatabase>({
  dialect,
});

export { silver };
