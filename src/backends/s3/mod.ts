import { Context } from "@hono/hono";
import {
  copyObject,
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
import { areQueryParamsSupported } from "../../utils/url.ts";
import { extractRequestInfo } from "../../utils/s3.ts";
import { getLogger } from "../../utils/log.ts";

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
  copyObject,
};

const logger = getLogger(import.meta);
export async function s3Resolver(
  c: Context,
  bucketConfig: S3BucketConfig,
) {
  const rawRequest = c.req.raw;
  const { method, objectKey, queryParams } = extractRequestInfo(rawRequest);
  const queryParamKeys = Object.keys(queryParams);

  logger.debug(`Resolving S3 Handler for Request...`);
  switch (method) {
    case "GET":
      if (objectKey) {
        return await handlers.getObject(rawRequest, bucketConfig);
      } else if (queryParams["list-type"]) {
        return await handlers.listObjects(c, bucketConfig);
      }

      if (!areQueryParamsSupported(queryParamKeys)) {
        logger.critical("Unsupported Query Parameter Used");
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
      logger.critical("POST Method Not Supported");
      throw new HTTPException(405, {
        message: "Method Not Allowed",
      });
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
      logger.critical(`Unsupported Request Method: ${method}`);
      throw new HTTPException(400, { message: "Unsupported Request" });
  }
}
