import { ReplicaSwiftConfig, SwiftBucketConfig } from "../../config/types.ts";
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
  req: Request,
  bucketConfig: SwiftBucketConfig | ReplicaSwiftConfig,
): Promise<Response | undefined> {
  const { method, objectKey } = s3Utils.extractRequestInfo(req);
  const url = new URL(req.url);
  const queryParam = url.searchParams.keys().next().value;

  logger.debug(`Resolving Swift Handler for Request...`);
  // Handle query parameter-based requests
  if (queryParam) {
    switch (queryParam) {
      case "policy":
        return await getBucketPolicy(req, bucketConfig);
      case "acl":
        return await getBucketAcl(req, bucketConfig);
      case "versioning":
        return await getBucketVersioning(req, bucketConfig);
      case "accelerate":
        return getBucketAccelerate(req, bucketConfig);
      case "logging":
        return getBucketLogging(req, bucketConfig);
      case "lifecycle":
        return getBucketLifecycle(req, bucketConfig);
      case "website":
        return getBucketWebsite(req, bucketConfig);
      case "requestPayment":
        return getBucketPayment(req, bucketConfig);
      case "encryption":
        return await getBucketEncryption(req, bucketConfig);
      case "cors":
        return getBucketCors(req, bucketConfig);
      case "replication":
        return getBucketReplication(req, bucketConfig);
      case "object-lock":
        return getBucketObjectLock(req, bucketConfig);
      case "tagging":
        return await getBucketTagging(req, bucketConfig);
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
        return await handlers.getObject(req, bucketConfig);
      }

      return await handlers.listObjects(req, bucketConfig);
    case "POST":
      break;
    case "PUT":
      if (objectKey && req.headers.get("x-amz-copy-source") !== undefined) {
        return await handlers.copyObject(req, bucketConfig);
      } else if (objectKey) {
        return await handlers.putObject(req, bucketConfig);
      }

      return await handlers.createBucket(req, bucketConfig);
    case "DELETE":
      if (objectKey) {
        return await handlers.deleteObject(req, bucketConfig);
      }

      return await handlers.deleteBucket(req, bucketConfig);
    case "HEAD":
      if (objectKey) {
        return await handlers.headObject(req, bucketConfig);
      }

      return await handlers.headBucket(req, bucketConfig);
    default:
      logger.critical(`Unsupported Request: ${method}`);
      throw new HTTPException(400, { message: "Unsupported Request" });
  }
}
