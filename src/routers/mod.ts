import { Context } from "@hono/hono";
import { extractRequestInfo } from "../utils/s3.ts";
import {
  deleteObject,
  getObject,
  getObjectMeta,
  listObjects,
  putObject,
} from "./objects.ts";
import { createBucket, deleteBucket } from "./buckets.ts";

const handlers = {
  putObject,
  getObject,
  deleteObject,
  getObjectMeta,
  createBucket,
  deleteBucket,
  listObjects,
};

export async function resolveHandler(c: Context) {
  const { method, objectKey } = extractRequestInfo(c.req);

  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(c);
      } else {
        return await handlers.listObjects(c);
      }
    case "POST":
      break;
    case "PUT":
      if (objectKey) {
        return await handlers.putObject(c);
      } else {
        return await handlers.createBucket(c);
      }
    case "DELETE":
      if (objectKey) {
        return await handlers.deleteObject(c);
      } else {
        return await handlers.deleteBucket(c);
      }
    default:
      throw new Error("Unsupported Request");
  }
}
