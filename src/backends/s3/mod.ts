import { Context } from "@hono/hono";
import {
  deleteObject,
  getObject,
  headObject,
  listObjects,
  putObject,
} from "./objects.ts";
import {
  createBucket,
  deleteBucket,
  headBucket,
  routeQueryParamedRequest,
} from "./buckets.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { S3BucketConfig } from "../../config/types.ts";
import { extractRequestInfo } from "../../utils/mod.ts";
import { areQueryParamsSupported } from "../../utils/url.ts";

const handlers = {
  putObject,
  getObject,
  deleteObject,
  headObject,
  createBucket,
  deleteBucket,
  listObjects,
  routeQueryParamedRequest,
  headBucket,
};

export async function s3Resolver(
  c: Context,
  bucketConfig: S3BucketConfig,
) {
  const { method, objectKey, queryParams } = extractRequestInfo(c.req);
  const queryParamKeys = Object.keys(queryParams);

  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(c, bucketConfig);
      } else if (queryParams["list-type"]) {
        return await handlers.listObjects(c, bucketConfig);
      }

      if (!areQueryParamsSupported(queryParamKeys)) {
        throw new HTTPException(400, {
          message: "Unsupported Query Parameter Used",
        });
      }
      return await handlers.routeQueryParamedRequest(
        c,
        bucketConfig,
        queryParamKeys,
      );
    case "POST":
      throw new HTTPException(405, {
        message: "Method Not Allowed",
      });
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
