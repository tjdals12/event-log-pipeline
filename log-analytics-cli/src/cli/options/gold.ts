import { z } from "zod";

import { DefaultSchema, RequiredYMDSchema } from "./base";

export const goldSchemas: Record<string, Record<string, z.ZodType>> = {
  fact_retention_daily: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
  fact_dau_daily: {
    "create-table": DefaultSchema,
    "overwrite-daily": RequiredYMDSchema,
    "drop-table": DefaultSchema,
  },
};
