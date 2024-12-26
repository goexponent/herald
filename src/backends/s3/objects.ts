import { Context } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger, reportToSentry } from "../../utils/log.ts";
import { S3BucketConfig } from "../../config/mod.ts";
import { prepareMirrorRequests } from "../mirror.ts";
import { isBucketConfig, S3Config } from "../../config/types.ts";

const logger = getLogger(import.meta);

export async function getObject(req: Request, _bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying Get Object Request...");

  const response = await forwardRequestWithTimeouts(
    req,
    _bucketConfig.config,
  );

  if (response.status !== 200) {
    const errMessage = `Get Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function listObjects(c: Context, bucketConfig: S3BucketConfig) {
  logger.info("[S3 backend] Proxying List Objects Request...");

  const response = await forwardRequestWithTimeouts(
    c.req.raw,
    bucketConfig.config,
  );

  if (response.status !== 200) {
    const errMessage = `List Objects Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`List Objects Successful: ${response.statusText}`);
  }

  return response;
}

export async function putObject(
  req: Request,
  bucketConfig: S3Config | S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Put Object Request...");

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
    const errMessage = `Put Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as S3BucketConfig,
        "putObject",
      );
    }
  }
  logger.debug(`Put Object Response: ${Deno.inspect(await response.text())}`);

  return response;
}

export async function deleteObject(
  req: Request,
  bucketConfig: S3Config | S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Delete Object Request...");

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
    const errMesage = `Delete Object Failed: ${response.statusText}`;
    logger.warn(`Delete Object Failed: ${response.statusText}`);
    reportToSentry(errMesage);
  } else {
    logger.info(`Delete Object Successfull: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as S3BucketConfig,
        "deleteObject",
      );
    }
  }

  return response;
}

export async function copyObject(
  req: Request,
  bucketConfig: S3Config | S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Copy Object Request...");

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
    const errMessage = `Copy Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Copy Object Successfull: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as S3BucketConfig,
        "copyObject",
      );
    }
  }

  return response;
}

export function getObjectMeta(c: Context) {
  return c.text("Not Implemented");
}

export async function headObject(
  req: Request,
  bucketConfig: S3BucketConfig,
) {
  logger.info("[S3 backend] Proxying Head Object Request...");

  const response = await forwardRequestWithTimeouts(
    req,
    bucketConfig.config,
  );

  if (response.status != 200) {
    const errMessage = `Head Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
  } else {
    logger.info(`Head Object Successfull: ${response.statusText}`);
  }

  return response;
}
