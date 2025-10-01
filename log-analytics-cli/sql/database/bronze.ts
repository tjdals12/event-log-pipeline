import { SqliteDialect, Kysely } from "kysely";
import SQLite from "better-sqlite3";

import { BronzeDatabase } from "../types/tables/01_bronze";

const dialect = new SqliteDialect({
  database: new SQLite(":memory:"),
});

const bronze = new Kysely<BronzeDatabase>({
  dialect,
});

export { bronze };
