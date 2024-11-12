import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/mod.ts";
import { getLogger } from "../../utils/log.ts";
import { extractRequestInfo } from "../../utils/mod.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getAuthTokenWithTimeouts, getSwiftRequestHeaders } from "./auth.ts";
import { getBodyFromHonoReq } from "../../utils/url.ts";
import { toS3XmlContent } from "./utils/mod.ts";
import { NoSuchBucketException } from "../../constants/errors.ts";

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

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig.config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

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

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
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

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig.config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "DELETE",
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

  const { bucket, queryParams: query } = extractRequestInfo(c.req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig.config,
    );
  const headers = getSwiftRequestHeaders(authToken);

  const params = new URLSearchParams();
  if (query.prefix) params.append("prefix", query.prefix[0]);
  if (query.delimiter) params.append("delimiter", query.delimiter[0]);
  if (query.continuationtoken) {
    params.append("marker", query.continuationtoken[0]);
  }
  if (query["max-keys"]) params.append("limit", query["max-keys"][0]);

  headers.delete("Accept");
  headers.set("Accept", "application/json");

  const reqUrl = `${swiftUrl}/${bucket}?${params.toString()}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromHonoReq(c.req),
  });

  if (response.status === 404) {
    logger.warn(`Get List of Objects Failed: ${response.statusText}`);
    throw NoSuchBucketException();
  } else {
    logger.info(`Get List of Objects Successful: ${response.statusText}`);
  }

  const delimiter = query.delimiter ? query.delimiter[0] : undefined;
  const prefix = query.prefix ? query.prefix[0] : undefined;
  const maxKeys = query["max-keys"] ? Number(query["max-keys"][0]) : undefined;
  const formattedResponse = await toS3XmlContent(
    response,
    bucket,
    delimiter,
    prefix,
    maxKeys,
  );
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

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
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

export async function headObject(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Head Object Request...");

  const { bucket, objectKey } = extractRequestInfo(c.req);
  if (!bucket || !objectKey) {
    throw new HTTPException(404, {
      message: "Bucket or object information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${objectKey}`;

  const response = await fetch(reqUrl, {
    method: "HEAD",
    headers: headers,
  });

  if (response.status >= 300) {
    logger.warn(`Head object Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  logger.info(`Head object Successful: ${response.statusText}`);

  // Create a new response with only the headers
  const headResponse = new Response(null, {
    status: response.status,
    headers: response.headers,
  });

  return headResponse;
}
