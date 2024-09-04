import { Hono } from "@hono/hono";

import { configInit, globalConfig } from "./config/mod.ts";
import { getLogger, setupLoggers } from "./utils/log.ts";
import { resolveHandler } from "./backends/mod.ts";
import { HTTPException } from "./types/http-exception.ts";

// setup
await configInit();
await setupLoggers();

const app = new Hono();
const logger = getLogger(import.meta);

app.all("/*", async (c) => {
  return await resolveHandler(c);
});

// misc
app.get("/", (c) => {
  return c.text("Proxy is running...");
});

// TODO: automated logs for common log messages across the endpoints
app.get("/healthcheck", (c) => {
  let logMsg = `Receieved request on ${c.req.url}`;
  logger.info(logMsg);

  // TODO: thorough health check,

  const healthStatus = "Ok";
  logMsg = `Health Check Complete: ${healthStatus}`;

  logger.info(logMsg);
  return c.text(healthStatus, 200);
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
