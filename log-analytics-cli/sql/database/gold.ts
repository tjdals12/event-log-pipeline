import { SqliteDialect, Kysely } from "kysely";
import SQLite from "better-sqlite3";

import { GoldDatabase } from "../types/tables/03_gold";

const dialect = new SqliteDialect({
  database: new SQLite(":memory:"),
});

const gold = new Kysely<GoldDatabase>({
  dialect,
});

export { gold };
