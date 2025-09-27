import type { Registry } from "./types";

import * as fact_retention_daily from "@/jobs/03_gold/01_fact_retention_daily";
import * as fact_dau_daily from "@/jobs/03_gold/02_fact_dau_daily";

const gold: Registry = {
  fact_retention_daily: {
    "create-table": fact_retention_daily.createTable,
    "overwrite-daily": fact_retention_daily.overwriteDaily,
    "drop-table": fact_retention_daily.dropTable,
  },
  fact_dau_daily: {
    "create-table": fact_dau_daily.createTable,
    "overwrite-daily": fact_dau_daily.overwriteDaily,
    "drop-table": fact_dau_daily.dropTable,
  },
};

export default gold;
