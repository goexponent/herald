import { z } from "zod";

const backendSchema = z.object({
  protocol: z.enum(["s3", "swift"]),
});

export const s3ConfigSchema = z.object({
  endpoint: z.string(),
  region: z.string(),
  bucket: z.string(),
  forcePathStyle: z.boolean(),
  credentials: z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
});
export type S3Config = z.infer<typeof s3ConfigSchema>;

export const s3BucketConfigSchema = z.object({
  backend: z.string(),
  config: s3ConfigSchema,
});
export type S3BucketConfig = z.infer<typeof s3BucketConfigSchema>;

export const swiftConfigSchema = z.object({
  auth_url: z.string(),
  container: z.string(),
  region: z.string(),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
    project_name: z.string(),
    user_domain_name: z.string(),
    project_domain_name: z.string(),
  }),
});
export type SwiftConfig = z.infer<typeof swiftConfigSchema>;

export const swiftBucketConfigSchema = z.object({
  backend: z.string(),
  config: swiftConfigSchema,
});
export type SwiftBucketConfig = z.infer<typeof swiftBucketConfigSchema>;

export const globalConfigSchema = z.object({
  port: z.number().int(),
  temp_dir: z.string(),
  backends: z.record(backendSchema),
  buckets: z.record(z.union([
    s3BucketConfigSchema,
    swiftBucketConfigSchema,
  ])),
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;

const zBooleanString = z.preprocess(
  (a: unknown) => z.coerce.string().parse(a) === "true",
  z.boolean(),
);

export const envVarConfigSchema = z.object({
  debug: zBooleanString,
  log_level: z
    .enum(["NOTSET", "DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"])
    .optional(),
  env: z.enum(["DEV", "PROD"]).default("DEV"),
  config_file_path: z.string().default("herald.yaml"),
  version: z.string().default("0.1"),
  sentry_dsn: z.string().optional(),
  sentry_sample_rate: z.coerce.number().positive().min(0).max(1).default(1),
  sentry_traces_sample_rate: z.coerce.number().positive().min(0).max(1).default(
    1,
  ),
});
export type EnvVarConfig = z.infer<typeof envVarConfigSchema>;
