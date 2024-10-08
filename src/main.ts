import { Hono } from "@hono/hono";

import { configInit, envVarsConfig, globalConfig } from "./config/mod.ts";
import { getLogger, setupLoggers } from "./utils/log.ts";
import { resolveHandler } from "./backends/mod.ts";
import { HTTPException } from "./types/http-exception.ts";
import * as Sentry from "sentry";

// setup
await configInit();
await setupLoggers();

// Sentry setup
Sentry.init({
  dsn: envVarsConfig.sentry_dsn,
  release: envVarsConfig.version,
  environment: envVarsConfig.env === "DEV" ? "development" : "production",
  sampleRate: envVarsConfig.sentry_sample_rate,
  tracesSampleRate: envVarsConfig.sentry_traces_sample_rate,
  // integrations: [
  //   new Sentry.Integrations.Context({
  //     app: true,
  //     os: true,
  //     device: true,
  //     culture: true,
  //   }),
  // ],
  debug: true,
});

const app = new Hono();
const logger = getLogger(import.meta);

app.all("/*", async (c) => {
  const path = c.req.path;
  if (path === "/health-check") {
    let logMsg = `Receieved request on ${c.req.url}`;
    logger.info(logMsg);

    // TODO: thorough health check,

    const healthStatus = "Ok";
    logMsg = `Health Check Complete: ${healthStatus}`;

    logger.info(logMsg);
    return c.text(healthStatus, 200);
  } else if (path === "/") {
    let logMsg = `Receieved request on ${c.req.url}`;
    logger.info(logMsg);

    // TODO: thorough health check,

    const healthStatus = "Ok";
    logMsg = `Health Check Complete: ${healthStatus}`;

    logger.info(logMsg);
    return c.text(healthStatus, 200);
  }

  return await resolveHandler(c);
});

app.notFound((c) => {
  logger.warn(`Resource not found: ${c.req.url}`);
  return c.text("Not Found", 404);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse();
  }

  return c.text("Something wrong happened in the proxy.");
});

Deno.serve({ port: globalConfig.port }, app.fetch);

export default app;
