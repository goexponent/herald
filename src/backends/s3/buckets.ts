import { Context } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger } from "../../utils/log.ts";
import { S3BucketConfig } from "../../config/mod.ts";

const logger = getLogger(import.meta);

export async function createBucket(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Create Bucket Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
  );

  if (response.status != 200) {
    logger.warn(`Create Bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Create Bucket Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteBucket(c: Context, bucketConfig: S3BucketConfig) {
  // Step 1: process the request
  logger.info("[S3 backend] Proxying Delete Bucket Request...");

  const response = await forwardRequestWithTimeouts(
    c.req,
    bucketConfig,
  );

  if (response.status != 204) {
    logger.warn(`Delete Bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Bucket Successful: ${response.statusText}`);
  }

  return response;
}
