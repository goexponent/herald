import { loadConfig, loadEnvConfig } from "./loader.ts";

export const appConfig = await loadConfig();
export const envVarsConfig = loadEnvConfig();
