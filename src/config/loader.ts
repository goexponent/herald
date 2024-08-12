import { z } from "zod";
import { EnvVarConfig, GlobalConfig, globalConfigSchema } from "./types.ts";
import { parse } from "@std/yaml";
import { deepMerge } from "std/collections/mod.ts";
import { getLogger } from "../utils/log.ts";
import { envVarConfigSchema } from "./types.ts";

const logger = getLogger(import.meta);

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
  const environment = envConfig.env;
  const yamlFilePath = envConfig.config_file_path;

  // deno-lint-ignore no-explicit-any
  const yamlConfig = await readYamlFile(yamlFilePath) as any;

  let rawConfig;
  if (environment === "DEV") {
    rawConfig = yamlConfig.dev;
  } else {
    rawConfig = yamlConfig.prod;
  }

  const config = configOrExit(
    globalConfigSchema,
    {}, // defaults
    [rawConfig],
  );

  return config as GlobalConfig;
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
    logger.error("failed to parse config");
    if (e instanceof ConfigError) {
      logger.error(e.issues);
    } else {
      logger.error(e);
    }
    Deno.exit(1);
  }
}
