import { Hono } from "@hono/hono";

import objects from "./routers/objects.ts";
import buckets from "./routers/buckets.ts";

import { getLogger, setupLoggers } from "./utils/log.ts";
import { appConfig } from "./config/mod.ts";
import { BUCKETS_ROUTE, OBJECTS_ROUTE } from "./constants/routes.ts";
import { resolveHandler } from "./routers/mod.ts";
import { HTTPException } from "./types/http-exception.ts";

// setup
await setupLoggers();

const app = new Hono();
const logger = getLogger(import.meta);

// routes
app.route(OBJECTS_ROUTE, objects);
app.route(BUCKETS_ROUTE, buckets);

app.all("/*", async (c) => {
  return await resolveHandler(c);
});

// misc
app.get("/", (c) => {
  return c.text("Proxy is running...");
});
app.get("/config", (c) => {
  const logMsg = `Receieved request on ${c.req.url}`;
  logger.info(logMsg);
  return c.json(appConfig);
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

Deno.serve({ port: appConfig.port }, app.fetch);

export default app;
