import { z } from "zod";
import {
  Backend,
  BackupConfig,
  BackupS3Config,
  backupS3ConfigSchema,
  BackupSwiftConfig,
  backupSwiftConfigSchema,
  EnvVarConfig,
  GlobalConfig,
  globalConfigSchema,
  S3BucketConfig,
  s3BucketConfigSchema,
  SwiftBucketConfig,
  swiftBucketConfigSchema,
} from "./types.ts";
import { parse } from "@std/yaml";
import { deepMerge } from "std/collections/mod.ts";
import { envVarConfigSchema } from "./types.ts";
import { globalConfig } from "./mod.ts";
import { red } from "std/fmt/colors.ts";

// const logger = getLogger(import.meta, "INFO");

export class ConfigError extends Error {
  // deno-lint-ignore no-explicit-any
  constructor(public issues: any) {
    super(`config error: ${JSON.stringify(issues)}`);
  }
}

async function readYamlFile(yamlFilePath: string) {
  const fileContent = await Deno.readTextFile(yamlFilePath);
  return parse(fileContent);
}

export async function loadConfig(): Promise<GlobalConfig> {
  const envConfig = loadEnvConfig();
  const yamlFilePath = envConfig.config_file_path;

  // deno-lint-ignore no-explicit-any
  const yamlConfig = await readYamlFile(yamlFilePath) as any;

  const rawConfig = yamlConfig;

  const config = configOrExit(
    globalConfigSchema,
    {}, // defaults
    [rawConfig],
  ) as GlobalConfig;

  validateProtocol(config);

  return config;
}

function validateBackupProvidersConfig(
  backupConfigs: BackupConfig[],
  backendConfigs: Record<string, Backend>,
  bucketName: string,
) {
  for (const backupConfig of backupConfigs) {
    const backendDefinition = backendConfigs[backupConfig.backend];
    if (!backendDefinition) {
      throw new Error(
        `Backend Configuration missing for backup backend: ${backupConfig.backend} with bucket: ${bucketName}`,
      );
    }
    const protocol = backendDefinition.protocol;
    if (protocol === "s3") {
      configOrExit(backupS3ConfigSchema, {}, [
        backupConfig,
      ]);
    } else {
      configOrExit(backupSwiftConfigSchema, {}, [
        backupConfig,
      ]);
    }
  }
}

function configToString(
  config:
    | BackupS3Config
    | BackupSwiftConfig
    | S3BucketConfig
    | SwiftBucketConfig,
) {
  if (config.typ === "BackupS3Config" || config.typ === "S3BucketConfig") {
    const conf = config.config;
    return `${conf.endpoint}-${conf.region}-${conf.bucket}`;
  }

  const conf = config.config;
  return `${conf.auth_url}-${conf.region}-${conf.credentials.project_name}-${conf.container}`;
}

function checkDuplicateBackupConfig(
  bucketConfig: S3BucketConfig | SwiftBucketConfig,
  bucketName: string,
) {
  const backups = bucketConfig.backups;
  if (!backups) {
    return;
  }

  const configs = new Set<string>();
  configs.add(configToString(bucketConfig));
  for (const backup of backups) {
    const configStr = configToString(backup);
    if (configs.has(configStr)) {
      throw new Error(
        `Invalid Config: Duplicate providers found for ${bucketName}`,
      );
    }
    configs.add(configStr);
  }
}

function validateProtocol(config: GlobalConfig) {
  const buckets = config.buckets;
  for (const [bucketName, bucketConfig] of Object.entries(buckets)) {
    const backendDefinition = config.backends[bucketConfig.backend];
    if (!backendDefinition) {
      throw new Error(
        `Backend Configuration missing for backend: ${bucketConfig.backend} with bucket: ${bucketName}`,
      );
    }

    const protocol = backendDefinition.protocol;
    if (protocol === "s3") {
      configOrExit(s3BucketConfigSchema, {}, [
        bucketConfig,
      ]);
    } else {
      configOrExit(swiftBucketConfigSchema, {}, [
        bucketConfig,
      ]);

      // validate backup providers
      if (bucketConfig.backups) {
        validateBackupProvidersConfig(
          bucketConfig.backups,
          config.backends,
          bucketName,
        );
        checkDuplicateBackupConfig(bucketConfig, bucketName);
      }
    }
  }
}

export function getBackendDef(backendName: string): {
  protocol: "s3" | "swift";
} | null {
  return globalConfig.backends[backendName] ?? null;
}

export function getBucketConfig(
  bucketName: string,
): S3BucketConfig | SwiftBucketConfig | null {
  const definedBuckets = globalConfig.buckets;
  const bucketConfig = definedBuckets[bucketName];

  // check if a config exits for the bucket
  if (!bucketConfig) {
    return null;
  }

  // get the protocol type and parse the config accordingly
  const backendName = bucketConfig.backend;
  const backendDef = getBackendDef(backendName);
  if (!backendDef) {
    return null;
  }

  const protocol = backendDef.protocol;
  if (protocol === "s3") {
    return configOrExit(s3BucketConfigSchema, {}, [
      bucketConfig,
    ]) as S3BucketConfig;
  } else {
    return configOrExit(swiftBucketConfigSchema, {}, [
      bucketConfig,
    ]) as SwiftBucketConfig;
  }
}

export function loadEnvConfig(
  defaults: Partial<EnvVarConfig> = {},
): EnvVarConfig {
  const envVars = Object.keys(envVarConfigSchema.shape)
    .map((k) => k.toUpperCase());

  const config = configOrExit(
    envVarConfigSchema,
    defaults,
    [
      Object.fromEntries(
        envVars
          .map((k) => [k.toLocaleLowerCase(), Deno.env.get(k)])
          .filter(([_, v]) => v !== undefined),
      ),
    ],
  );

  return config as EnvVarConfig;
}

function parseConfig<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  defaults: Partial<z.input<typeof schema>>,
  sources: Array<Record<string, unknown>>,
) {
  const raw = [defaults as Record<string, unknown>, ...sources].reduce(
    (acc, obj) => deepMerge(acc, obj),
    {} as Record<string, unknown>,
  );

  return schema.safeParse(raw);
}

export function configOrThrow<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  defaults: Partial<z.input<typeof schema>>,
  sources: Array<Record<string, unknown>>,
) {
  const result = parseConfig(schema, defaults, sources);
  if (!result.success) {
    throw new ConfigError(result.error.issues);
  }

  return result.data;
}

export function configOrExit<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  defaults: Partial<z.input<typeof schema>>,
  sources: Array<Record<string, unknown>>,
) {
  try {
    return configOrThrow(schema, defaults, sources);
  } catch (e) {
    // deno-lint-ignore no-console
    console.error(red("failed to parse config"));
    if (e instanceof ConfigError) {
      // deno-lint-ignore no-console
      console.error(red(Deno.inspect(e.issues)));
    } else {
      // deno-lint-ignore no-console
      console.error(red(e));
    }
    Deno.exit(1);
  }
}
