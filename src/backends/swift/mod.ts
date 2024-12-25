import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/types.ts";
import {
  copyObject,
  deleteObject,
  getObject,
  getObjectMeta,
  headObject,
  listObjects,
  putObject,
} from "./objects.ts";
import {
  createBucket,
  deleteBucket,
  getBucketAccelerate,
  getBucketAcl,
  getBucketCors,
  getBucketEncryption,
  getBucketLifecycle,
  getBucketLogging,
  getBucketObjectLock,
  getBucketPayment,
  getBucketPolicy,
  getBucketReplication,
  getBucketTagging,
  getBucketVersioning,
  getBucketWebsite,
  headBucket,
} from "./buckets.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getLogger } from "../../utils/log.ts";
import { s3Utils } from "../../utils/mod.ts";

const handlers = {
  putObject,
  getObject,
  deleteObject,
  getObjectMeta,
  createBucket,
  deleteBucket,
  listObjects,
  headBucket,
  headObject,
  copyObject,
};

const logger = getLogger(import.meta);
export async function swiftResolver(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  const { method, objectKey } = s3Utils.extractRequestInfo(c.req.raw);
  const url = new URL(c.req.url);
  const queryParam = url.searchParams.keys().next().value;

  logger.debug(`Resolving Swift Handler for Request...`);
  // Handle query parameter-based requests
  if (queryParam) {
    switch (queryParam) {
      case "policy":
        return await getBucketPolicy(c, bucketConfig);
      case "acl":
        return await getBucketAcl(c, bucketConfig);
      case "versioning":
        return await getBucketVersioning(c, bucketConfig);
      case "accelerate":
        return getBucketAccelerate(c, bucketConfig);
      case "logging":
        return getBucketLogging(c, bucketConfig);
      case "lifecycle":
        return getBucketLifecycle(c, bucketConfig);
      case "website":
        return getBucketWebsite(c, bucketConfig);
      case "requestPayment":
        return getBucketPayment(c, bucketConfig);
      case "encryption":
        return await getBucketEncryption(c, bucketConfig);
      case "cors":
        return getBucketCors(c, bucketConfig);
      case "replication":
        return getBucketReplication(c, bucketConfig);
      case "object-lock":
        return getBucketObjectLock(c, bucketConfig);
      case "tagging":
        return await getBucketTagging(c, bucketConfig);
      // ignore these as they will be handled as regular request below
      case "x-id":
      case "list-type":
        break;
      default:
        logger.critical(`Unsupported query parameter: ${queryParam}`);
        throw new HTTPException(400, {
          message: "Unsupported query parameter",
        });
    }
  }

  // Handle regular requests
  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(c.req.raw, bucketConfig);
      }

      return await handlers.listObjects(c.req.raw, bucketConfig);
    case "POST":
      break;
    case "PUT":
      if (objectKey && c.req.header("x-amz-copy-source") !== undefined) {
        return await handlers.copyObject(c.req.raw, bucketConfig);
      } else if (objectKey) {
        return await handlers.putObject(c.req.raw, bucketConfig);
      }

      return await handlers.createBucket(c.req.raw, bucketConfig);
    case "DELETE":
      if (objectKey) {
        return await handlers.deleteObject(c.req.raw, bucketConfig);
      }

      return await handlers.deleteBucket(c.req.raw, bucketConfig);
    case "HEAD":
      if (objectKey) {
        return await handlers.headObject(c.req.raw, bucketConfig);
      }

      return await handlers.headBucket(c, bucketConfig);
    default:
      logger.critical(`Unsupported Request: ${method}`);
      throw new HTTPException(400, { message: "Unsupported Request" });
  }
}
