import { Context } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger } from "../../utils/log.ts";
import { S3BucketConfig } from "../../config/mod.ts";

const logger = getLogger(import.meta);

export async function getObject(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Get Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
  );

  if (response.status !== 200) {
    logger.warn(`Get Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function listObjects(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying List Objects Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
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
    c.req,
    bucketConfig,
  );

  if (response.status != 200) {
    logger.warn(`Put Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteObject(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Delete Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
  );

  if (response.status != 204) {
    logger.error(`Delete Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Object Successfull: ${response.statusText}`);
  }

  return response;
}

export async function headObject(
  c: Context,
  bucketConfig: S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Head Object Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
  );

  if (response.status != 200) {
    const errMessage = `Head Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
  } else {
    logger.info(`Head Object Successfull: ${response.statusText}`);
  }

  return response;
}
