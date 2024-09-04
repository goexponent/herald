import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/types.ts";
import {
  deleteObject,
  getObject,
  getObjectMeta,
  listObjects,
  putObject,
} from "./objects.ts";
import { createBucket, deleteBucket } from "./buckets.ts";
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
};

export async function swiftResolver(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  const { method, objectKey } = extractRequestInfo(c.req);

  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(c, bucketConfig);
      } else {
        return await handlers.listObjects(c, bucketConfig);
      }
    case "POST":
      break;
    case "PUT":
      if (objectKey) {
        return await handlers.putObject(c, bucketConfig);
      } else {
        return await handlers.createBucket(c, bucketConfig);
      }
    case "DELETE":
      if (objectKey) {
        return await handlers.deleteObject(c, bucketConfig);
      } else {
        return await handlers.deleteBucket(c, bucketConfig);
      }
    default:
      throw new HTTPException(400, { message: "Unsupported Request" });
  }
}
