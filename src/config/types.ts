import { z } from "zod";

export const globalConfigSchema = z.object({
  port: z.number().int(),
  temp_dir: z.string(),
  s3_config: z.object({
    endpoint: z.string(),
    region: z.string(),
    bucket: z.string().optional(),
    forcePathStyle: z.boolean(),
    credentials: z.object({
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }),
  }),
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;

const zBooleanString = z.preprocess(
  (a: unknown) => z.coerce.string().parse(a) === "true",
  z.boolean(),
);

export const envVarConfigSchema = z.object({
  debug: zBooleanString,
  log_level: z
    .enum(["NOTSET", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    .optional(),
  env: z.enum(["DEV", "PROD"]).default("DEV"),
  config_file_path: z.string().default("herald.yaml"),
});
export type EnvVarConfig = z.infer<typeof envVarConfigSchema>;
