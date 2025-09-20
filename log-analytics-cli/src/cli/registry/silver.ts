import * as events_clean from "@/jobs/02_silver/01_events_clean";
import * as int_signup_first from "@/jobs/02_silver/10_int_signup_first";
import * as int_signup_daily from "@/jobs/02_silver/11_int_signup_daily";
import * as int_active_daily from "@/jobs/02_silver/20_int_active_daily";
import * as int_first_session_after_signup from "@/jobs/02_silver/21_int_first_session_after_signup";

import type { Registry } from "./types";

const silver: Registry = {
  events_clean: {
    "create-table": events_clean.createTable,
    "insert-daily": events_clean.insertDaily,
    "insert-monthly": events_clean.insertMonthly,
    "overwrite-daily": events_clean.overwriteDaily,
    "drop-table": events_clean.dropTable,
  },
  int_signup_first: {
    "create-table": int_signup_first.createTable,
    "overwrite-daily": int_signup_first.overwriteDaily,
    "drop-table": int_signup_first.dropTable,
  },
  int_signup_daily: {
    "create-table": int_signup_daily.createTable,
    "overwrite-daily": int_signup_daily.overwriteDaily,
    "drop-table": int_signup_daily.dropTable,
  },
  int_active_daily: {
    "create-table": int_active_daily.createTable,
    "overwrite-daily": int_active_daily.overwriteDaily,
    "drop-table": int_active_daily.dropTable,
  },
  int_first_session_after_signup: {
    "create-table": int_first_session_after_signup.createTable,
    "overwrite-daily": int_first_session_after_signup.overwriteDaily,
    "drop-table": int_first_session_after_signup.dropTable,
  },
};

export default silver;
