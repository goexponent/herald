import { z } from "zod";

const backendSchema = z.object({
  protocol: z.enum(["s3", "swift"]),
});
export type Backend = z.infer<typeof backendSchema>;

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

export const backupS3ConfigSchema = z.object({
  backend: z.string(),
  config: s3ConfigSchema,
  typ: z.literal("BackupS3Config").default("BackupS3Config"),
});
export type BackupS3Config = z.infer<typeof backupS3ConfigSchema>;

export const backupSwiftConfigSchema = z.object({
  backend: z.string(),
  config: swiftConfigSchema,
  typ: z.literal("BackupSwiftConfig").default("BackupSwiftConfig"),
});
export type BackupSwiftConfig = z.infer<typeof backupSwiftConfigSchema>;

export const backupConfigSchema = z.union([
  backupS3ConfigSchema,
  backupSwiftConfigSchema,
]);
export type BackupConfig = z.infer<typeof backupConfigSchema>;
export function isBucketConfig(config: unknown): config is BucketConfig {
  return (config as BucketConfig).typ !== undefined;
}

export const s3BucketConfigSchema = z.object({
  backend: z.string(),
  config: s3ConfigSchema,
  backups: z.array(backupConfigSchema).optional(),
  typ: z.literal("S3BucketConfig").default("S3BucketConfig"),
});
export type S3BucketConfig = z.infer<typeof s3BucketConfigSchema>;

export const swiftBucketConfigSchema = z.object({
  backend: z.string(),
  config: swiftConfigSchema,
  backups: z.array(backupConfigSchema).optional(),
  typ: z.literal("SwiftBucketConfig").default("SwiftBucketConfig"),
});
export type SwiftBucketConfig = z.infer<typeof swiftBucketConfigSchema>;

export type BucketConfig = S3BucketConfig | SwiftBucketConfig;

export const globalConfigSchema = z.object({
  port: z.number().int(),
  temp_dir: z.string(),
  task_store_backend: s3ConfigSchema,
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

export const kuberentestServiceTokenSchema = z.object({
  serviceaccount: z.object({
    name: z.string(),
    uid: z.string(),
  }),
  sub: z.string(),
});
export type KuberentestServiceToken = z.infer<
  typeof kuberentestServiceTokenSchema
>;

export const podsConfigSchema = z.object({
  pods: z.array(kuberentestServiceTokenSchema),
});
export type PodsConfig = z.infer<typeof podsConfigSchema>;
