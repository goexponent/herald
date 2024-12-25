import { Context } from "@hono/hono";
import { formatParams, forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger, reportToSentry } from "../../utils/log.ts";
import { S3BucketConfig, S3Config } from "../../config/mod.ts";
import { isBucketConfig } from "../../config/types.ts";
import { prepareMirrorRequests } from "../mirror.ts";

const logger = getLogger(import.meta);

export async function createBucket(
  req: Request,
  bucketConfig: S3Config | S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Create Bucket Request...");

  let config: S3Config;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (bucketConfig.backups) {
      mirrorOperation = true;
    }
  } else {
    config = bucketConfig as S3Config;
  }

  const response = await forwardRequestWithTimeouts(
    req,
    config,
  );

  if (response.status != 200) {
    const errMessage = `Create Bucket Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Create Bucket Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as S3BucketConfig,
        "createBucket",
      );
    }
  }

  return response;
}

export async function deleteBucket(
  req: Request,
  bucketConfig: S3Config | S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Delete Bucket Request...");

  let config: S3Config;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (bucketConfig.backups) {
      mirrorOperation = true;
    }
  } else {
    config = bucketConfig as S3Config;
  }

  const response = await forwardRequestWithTimeouts(
    req,
    config,
  );

  if (response.status != 204) {
    const errMessage = `Delete Bucket Failed: ${response.statusText}`;
    reportToSentry(errMessage);
    logger.warn(errMessage);
  } else {
    logger.info(`Delete Bucket Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as S3BucketConfig,
        "deleteBucket",
      );
    }
  }

  return response;
}

export async function routeQueryParamedRequest(
  c: Context,
  bucketConfig: S3BucketConfig,
  queryParams: string[],
) {
  const formattedParams = formatParams(queryParams);
  logger.info(`[S3 backend] Proxying Get Bucket ${formattedParams} Request...`);

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
  );

  if (response.status != 200) {
    const errMessage =
      `Get Bucket ${formattedParams} Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(
      `Get Bucket ${formattedParams} Successful: ${response.statusText}`,
    );
  }

  return response;
}

export async function headBucket(
  c: Context,
  bucketConfig: S3BucketConfig,
): Promise<Response> {
  logger.info(`[S3 backend] Proxying Head Bucket Request...`);

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
  );

  if (response.status != 200) {
    const errMessage = `Head Bucket Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(
      `Head Bucket Successful: ${response.statusText}`,
    );
  }

  return response;
}
