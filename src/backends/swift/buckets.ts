import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/mod.ts";
import { getAuthToken, getSwiftRequestHeaders } from "./auth.ts";
import { extractRequestInfo } from "../../utils/mod.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getLogger } from "../../utils/log.ts";
import { getBodyFromHonoReq } from "../../utils/url.ts";

const logger = getLogger(import.meta);

export async function createBucket(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Create Bucket Request...");

  const { bucket } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const response = await fetch(reqUrl, {
    method: "PUT",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status >= 300) {
    logger.warn(`Create bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Create bucket Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteBucket(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Delete Bucket Request...");

  const { bucket } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const response = await fetch(reqUrl, {
    method: "Delete",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status !== 204) {
    logger.warn(`Delete bucket Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete bucket Successful: ${response.statusText}`);
  }

  return response;
}
