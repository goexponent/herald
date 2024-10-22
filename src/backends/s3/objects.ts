import { Context } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger } from "../../utils/log.ts";
import { S3BucketConfig } from "../../config/mod.ts";
import { prepareMirrorRequests } from "../mirror.ts";

const logger = getLogger(import.meta);

export function getObject(c: Context, _bucketConfig: S3BucketConfig) {
  return c.text("Not Implemented");
}

export async function listObjects(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying List Objects Request...");

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
  );

  if (response.status !== 200) {
    logger.warn(`List Objects Failed: ${response.statusText}`);
  } else {
    logger.info(`List Objects Successful: ${response.statusText}`);
  }

  return response;
}

export async function putObject(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Put Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
  );

  if (response.status != 200) {
    logger.warn(`Put Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
    await prepareMirrorRequests(c, bucketConfig, "putObject");
  }

  return response;
}

export async function deleteObject(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Delete Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
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
