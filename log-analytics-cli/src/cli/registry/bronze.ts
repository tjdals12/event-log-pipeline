import { createTable, dropTable } from "@/jobs/01_bronze/01_events_raw";

import type { Registry } from "./types";

const bronze: Registry = {
  events_raw: {
    "create-table": createTable,
    "drop-table": dropTable,
  },
};

export default bronze;
