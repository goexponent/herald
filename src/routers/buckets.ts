import { Context, Hono } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../utils/url.ts";
import { getLogger } from "../utils/log.ts";

const api = new Hono();
const _routerUrl = "/buckets";

const logger = getLogger(import.meta);

export async function createBucket(c: Context) {
  logger.info("Proxying Create Bucket Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
  );

  if (response.status != 200) {
    logger.warn(`Create Bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Create Bucket Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteBucket(c: Context) {
  // Step 1: process the request
  logger.info("Proxying Delete Bucket Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
  );

  if (response.status != 204) {
    logger.warn(`Delete Bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Bucket Successful: ${response.statusText}`);
  }

  return response;
}

export default api;
