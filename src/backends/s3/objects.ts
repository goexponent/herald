import { Context } from "@hono/hono";
import { forwardRequestWithTimeouts } from "../../utils/url.ts";
import { getLogger, reportToSentry } from "../../utils/log.ts";
import { S3BucketConfig, S3Config } from "../../config/mod.ts";
import { prepareMirrorRequests } from "../mirror.ts";
import { Bucket } from "../../buckets/mod.ts";
import { swiftResolver } from "../swift/mod.ts";
import { s3Resolver } from "./mod.ts";

const logger = getLogger(import.meta);

export async function getObject(
  req: Request,
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying Get Object Request...");

  let response = await forwardRequestWithTimeouts(
    req,
    bucketConfig.config as S3Config,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(req, replica)
        : await swiftResolver(req, replica);
      if (res instanceof Error) {
        logger.warn(`Get Object Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Get Object Failed: ${response.message}`);
    return response;
  }

  if (response.status !== 200) {
    const errMessage = `Get Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function listObjects(
  req: Request,
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying List Objects Request...");

  let response = await forwardRequestWithTimeouts(
    req,
    bucketConfig.config as S3Config,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(req, replica)
        : await swiftResolver(req, replica);
      if (res instanceof Error) {
        logger.warn(`List Objects Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`List Objects Failed: ${response.message}`);
    return response;
  }

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
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying Put Object Request...");

  const config: S3Config = bucketConfig.config as S3Config;
  const mirrorOperation = bucketConfig.hasReplicas();

  const response = await forwardRequestWithTimeouts(
    req,
    config,
  );

  if (response instanceof Error) {
    logger.warn(`Put Object Failed: ${response.message}`);
    return response;
  }

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

  return response;
}

export async function deleteObject(
  req: Request,
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying Delete Object Request...");

  const config: S3Config = bucketConfig.config as S3Config;
  const mirrorOperation = bucketConfig.hasReplicas();

  const response = await forwardRequestWithTimeouts(
    req,
    config,
  );

  if (response instanceof Error) {
    logger.warn(`Delete Object Failed: ${response.message}`);
    return response;
  }

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
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying Copy Object Request...");

  const config: S3Config = bucketConfig.config as S3Config;
  const mirrorOperation = bucketConfig.hasReplicas();

  const response = await forwardRequestWithTimeouts(
    req,
    config,
  );

  if (response instanceof Error) {
    logger.warn(`Copy Object Failed: ${response.message}`);
    return response;
  }

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
  bucketConfig: Bucket,
) {
  logger.info("[S3 backend] Proxying Head Object Request...");

  let response = await forwardRequestWithTimeouts(
    req,
    bucketConfig.config as S3Config,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(req, replica)
        : await swiftResolver(req, replica);
      if (res instanceof Error) {
        logger.warn(`Head Object Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Head Object Failed: ${response.message}`);
    return response;
  }

  if (response.status != 200) {
    const errMessage = `Head Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
  } else {
    logger.info(`Head Object Successfull: ${response.statusText}`);
  }

  return response;
}
