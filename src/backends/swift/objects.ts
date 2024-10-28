import { getLogger } from "../../utils/log.ts";
import { extractRequestInfo } from "../../utils/mod.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getAuthTokenWithTimeouts, getSwiftRequestHeaders } from "./auth.ts";
import { getBodyFromReq } from "../../utils/url.ts";
import { toS3XmlContent } from "./utils/mod.ts";
import { NoSuchBucketException } from "../../constants/errors.ts";
import { SwiftConfig } from "../../config/types.ts";

const logger = getLogger(import.meta);

export async function putObject(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Put Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "PUT",
    headers: headers,
    body: getBodyFromReq(req),
  });

  if (response.status !== 201) {
    logger.warn(`Put Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function getObject(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromReq(req),
  });

  if (response.status !== 200) {
    logger.warn(`Get Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteObject(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Delete Object Request...");

  const { bucket, objectKey: object } = extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "DELETE",
    headers: headers,
    body: getBodyFromReq(req),
  });

  if (response.status !== 204) {
    logger.warn(`Delete Object Failed: ${response.statusText}`);
  } else {
    logger.info(`Delete Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function listObjects(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get List of Objects Request...");

  const { bucket } = extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromReq(req),
  });

  if (response.status === 404) {
    // TODO: return here if not found, returns in html format even if Accept set to xml
    logger.warn(`Get List of Objects Failed: ${response.statusText}`);
    throw NoSuchBucketException();
  } else {
    logger.info(`Get List of Objects Successful: ${response.statusText}`);
  }

  const formattedResponse = await toS3XmlContent(response);
  return formattedResponse;
}

export async function getObjectMeta(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get Object Meta Request...");

  const { bucket, objectKey: object } = extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      bucketConfig,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const response = await fetch(reqUrl, {
    method: "GET",
    headers: headers,
    body: getBodyFromReq(req),
  });

  if (response.status !== 201) {
    logger.warn(`Get Object Meta Failed: ${response.statusText}`);
  } else {
    logger.info(`Get Object Meta Successful: ${response.statusText}`);
  }

  return response;
}

export async function headObject(
  req: Request,
  bucketConfig: SwiftConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Head Object Request...");

  const { bucket, objectKey } = extractRequestInfo(req);
  if (!bucket || !objectKey) {
    throw new HTTPException(404, {
      message: "Bucket or object information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig);
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
