// deno-lint-ignore-file no-console
import { z } from "zod";
import {
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

export function loadEnvConfig(): EnvVarConfig {
  const envVars = Object.keys(envVarConfigSchema.shape)
    .map((k) => k.toUpperCase());

  const config = configOrExit(
    envVarConfigSchema,
    {},
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
    console.error("failed to parse config");
    if (e instanceof ConfigError) {
      console.error(e.issues);
    } else {
      console.error(e);
    }
    Deno.exit(1);
  }
}
