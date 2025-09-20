import { z } from "zod";

import { DefaultSchema, RequiredYMDSchema, RequiredYMSchema } from "./base";

export const silverSchemas: Record<string, Record<string, z.ZodType>> = {
  events_clean: {
    "create-table": DefaultSchema,
    "insert-daily": RequiredYMDSchema,
    "insert-monthly": RequiredYMSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
  int_signup_first: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
  int_signup_daily: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
  int_active_daily: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
  int_first_session_after_signup: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
};
