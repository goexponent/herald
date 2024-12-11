import {
  getBucketConfig,
  loadConfig,
  loadEnvConfig,
  loadPodsConfig,
} from "./loader.ts";
import {
  EnvVarConfig,
  GlobalConfig,
  PodsConfig,
  S3BucketConfig,
  SwiftBucketConfig,
} from "./types.ts";

// types export
export type { S3BucketConfig, S3Config, SwiftBucketConfig } from "./types.ts";

export const getS3Config = (bucketName: string) =>
  getBucketConfig(bucketName) as S3BucketConfig;
export const getSwiftConfig = (bucketName: string) =>
  getBucketConfig(bucketName) as SwiftBucketConfig;
export let globalConfig: GlobalConfig;
export let envVarsConfig: EnvVarConfig;
export let podsConfig: PodsConfig;
export { getBackendDef } from "./loader.ts";
export let proxyUrl: string;

export async function configInit() {
  globalConfig = await loadConfig();
  podsConfig = await loadPodsConfig();
  envVarsConfig = loadEnvConfig({
    sentry_sample_rate: 1,
    sentry_traces_sample_rate: 1,
  });
  proxyUrl = `http://localhost:${globalConfig.port}`;
}

await configInit();
