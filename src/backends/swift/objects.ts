import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/mod.ts";
import { getLogger } from "../../utils/log.ts";
import { extractRequestInfo } from "../../utils/mod.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getAuthToken, getSwiftRequestHeaders } from "./auth.ts";
import { getBodyFromHonoReq } from "../../utils/url.ts";
import { toS3XmlContent } from "./utils/mod.ts";

const logger = getLogger(import.meta);

export async function putObject(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Put Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  logger.debug;

  const response = await fetch(reqUrl, {
    method: "PUT",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status !== 201) {
    logger.warn(`Put Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function getObject(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status !== 200) {
    logger.warn(`Get Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteObject(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Delete Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "Delete",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status !== 204) {
    logger.warn(`Delete Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function listObjects(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get List of Objects Request...");

  const { bucket } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  const formattedResponse = await toS3XmlContent(response);
  if (response.status === 404) {
    // TODO: return here if not found, returns in html format even if Accept set to xml
    logger.warn(`Get List of Objects Failed: ${response.statusText}`);
  } else {
    logger.info(`Get List of Objects Successful: ${response.statusText}`);
  }

  return formattedResponse;
}

export async function getObjectMeta(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get Object Meta Request...");

  const { bucket, objectKey: object } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } = await getAuthToken(
    bucketConfig.config,
  );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status !== 201) {
    logger.warn(`Get Object Meta Failed: ${response.statusText}`);
  } else {
    logger.info(`Get Object Meta Successful: ${response.statusText}`);
  }

  return response;
}