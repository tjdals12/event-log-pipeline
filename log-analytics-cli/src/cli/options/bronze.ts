import { z } from "zod";

import { DefaultSchema } from "./base";

export const bronzeSchemas: Record<string, Record<string, z.ZodType>> = {
  events_raw: {
    "create-table": DefaultSchema,
    "drop-table": DefaultSchema,
  },
};
