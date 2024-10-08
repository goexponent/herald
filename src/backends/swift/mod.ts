import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/types.ts";
import {
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
import { extractRequestInfo } from "../../utils/mod.ts";

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
};

export async function swiftResolver(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  const { method, objectKey } = extractRequestInfo(c.req);
  const url = new URL(c.req.url);
  const queryParam = url.searchParams.keys().next().value;

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
      case "x-id":
        break;
      default:
        throw new HTTPException(400, {
          message: "Unsupported query parameter",
        });
    }
  }

  // Handle regular requests
  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(c, bucketConfig);
      }

      return await handlers.listObjects(c, bucketConfig);
    case "POST":
      break;
    case "PUT":
      if (objectKey) {
        return await handlers.putObject(c, bucketConfig);
      }

      return await handlers.createBucket(c, bucketConfig);
    case "DELETE":
      if (objectKey) {
        return await handlers.deleteObject(c, bucketConfig);
      }

      return await handlers.deleteBucket(c, bucketConfig);
    case "HEAD":
      if (objectKey) {
        return await handlers.headObject(c, bucketConfig);
      }

      return await handlers.headBucket(c, bucketConfig);
    default:
      throw new HTTPException(400, { message: "Unsupported Request" });
  }
}
