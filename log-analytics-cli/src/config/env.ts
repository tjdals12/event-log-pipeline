import * as dotenv from "dotenv";
import { z } from "zod";

const StageSchema = z.enum(["dev", "prod"]);

const AwsConfigSchema = z.object({
  region: z.string(),
  bucket: z.string(),
  athena: z.object({
    workgroup: z.string(),
    bronze: z.string(),
    silver: z.string(),
    gold: z.string(),
  }),
});

export type AwsConfig = z.infer<typeof AwsConfigSchema>;

const ConfigSchema = z.object({
  aws: AwsConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

export const loadConfig = (stage: string): Config => {
  const _stage = StageSchema.parse(stage);

  dotenv.config({ path: `.env.${_stage}`, quiet: true });

  const _config = ConfigSchema.parse({
    aws: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      athena: {
        workgroup: process.env.AWS_ATHENA_WORKGROUP,
        bronze: process.env.AWS_ATHENA_DB_BRONZE,
        silver: process.env.AWS_ATHENA_DB_SILVER,
        gold: process.env.AWS_ATHENA_DB_GOLD,
      },
    },
  });

  return _config;
};
