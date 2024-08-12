import { Context, Hono } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../utils/url.ts";
import { getLogger } from "../utils/log.ts";

const api = new Hono();

const logger = getLogger(import.meta);

export function getObject(c: Context) {
  return c.text("Not Implemented");
}

export async function listObjects(c: Context) {
  logger.info("Proxying List Objects Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
  );

  if (response.status !== 200) {
    logger.warn(`List Objects Failed: ${response.statusText}`);
  } else {
    logger.info(`List Objects Successful: ${response.statusText}`);
  }

  return response;
}

export async function putObject(c: Context) {
  logger.info("Proxying Put Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
  );

  if (response.status != 200) {
    logger.warn(`Put Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteObject(c: Context) {
  logger.info("Proxying Delete Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
  );

  if (response.status != 204) {
    logger.error(`Delete Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Object Successfull: ${response.statusText}`);
  }

  return response;
}

export function getObjectMeta(c: Context) {
  return c.text("Not Implemented");
}

export default api;
