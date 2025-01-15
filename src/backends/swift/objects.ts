import { getLogger, reportToSentry } from "../../utils/log.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getAuthTokenWithTimeouts, getSwiftRequestHeaders } from "./auth.ts";
import {
  getBodyFromReq,
  retryWithExponentialBackoff,
} from "../../utils/url.ts";
import { formatRFC3339Date, toS3XmlContent } from "./utils/mod.ts";
import { NoSuchBucketException } from "../../constants/errors.ts";
import {
  isBucketConfig,
  SwiftBucketConfig,
  SwiftConfig,
} from "../../config/types.ts";
import { S3_COPY_SOURCE_HEADER } from "../../constants/headers.ts";
import { s3Utils } from "../../utils/mod.ts";
import { hasReplica, prepareMirrorRequests } from "../mirror.ts";
const logger = getLogger(import.meta);

export async function putObject(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Put Object Request...");
  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }
  logger.debug(`Request: ${Deno.inspect(req)}`);

  let config: SwiftConfig;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (hasReplica(bucketConfig)) {
      mirrorOperation = true;
    }
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "PUT",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 201) {
    const errMessage = `Put Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as SwiftBucketConfig,
        "putObject",
      );
    }
  }

  return response;
}

export async function getObject(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Get Object Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  // let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (hasReplica(bucketConfig)) {
      // mirrorOperation = true;
    }
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "GET",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 200) {
    const errMessage = `Get Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Get Object Successful: ${response.statusText}`);
  }

  return response;
}

export async function deleteObject(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Delete Object Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (hasReplica(bucketConfig)) {
      mirrorOperation = true;
    }
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "DELETE",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 204) {
    const errMessage = `Delete Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Delete Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as SwiftBucketConfig,
        "deleteObject",
      );
    }
  }

  return response;
}

export async function listObjects(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Get List of Objects Request...");

  const { bucket, queryParams: query } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);

  const params = new URLSearchParams();
  if (query.prefix) params.append("prefix", query.prefix[0]);
  if (query.delimiter) params.append("delimiter", query.delimiter[0]);
  if (query["continuation-token"]) {
    params.append("marker", query["continuation-token"][0]);
  }
  if (query["max-keys"]) params.append("limit", query["max-keys"][0]);

  headers.delete("Accept");
  headers.set("Accept", "application/json");

  const reqUrl = `${swiftUrl}/${bucket}?${params.toString()}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "GET",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status === 404) {
    logger.warn(`Get List of Objects Failed: ${response.statusText}`);
    throw NoSuchBucketException();
  } else {
    logger.info(`Get List of Objects Successful: ${response.statusText}`);
  }

  const delimiter = query.delimiter ? query.delimiter[0] : undefined;
  const prefix = query.prefix ? query.prefix[0] : undefined;
  const maxKeys = query["max-keys"] ? Number(query["max-keys"][0]) : undefined;
  const continuationToken = query["continuation-token"]
    ? query["continuation-token"][0]
    : undefined;
  const formattedResponse = await toS3XmlContent(
    response,
    bucket,
    delimiter,
    prefix,
    maxKeys,
    continuationToken,
  );
  return formattedResponse;
}

export async function getObjectMeta(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Get Object Meta Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "GET",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 201) {
    const errMessage = `Get Object Meta Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Get Object Meta Successful: ${response.statusText}`);
  }

  return response;
}

export async function headObject(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Head Object Request...");

  const { bucket, objectKey } = s3Utils.extractRequestInfo(req);
  if (!bucket || !objectKey) {
    throw new HTTPException(404, {
      message: "Bucket or object information missing from the request",
    });
  }

  let config: SwiftConfig;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${objectKey}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

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

// currently supports copy within the same project
export async function copyObject(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Copy Object Request...");
  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (hasReplica(bucketConfig)) {
      mirrorOperation = true;
    }
  } else {
    config = bucketConfig as SwiftConfig;
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(
      config,
    );
  const headers = getSwiftRequestHeaders(authToken);
  const copySource = `/${bucket}/${object}`;
  headers.set(S3_COPY_SOURCE_HEADER, copySource);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "PUT",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 201) {
    const errMessage = `Copy Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Copy Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as SwiftBucketConfig,
        "copyObject",
      );
    }
  }

  const s3ResponseHeaders = new Headers();
  s3ResponseHeaders.set(
    "x-amz-copy-source-version-id",
    response.headers.get("x-openstack-request-id") || "",
  );
  s3ResponseHeaders.set(
    "x-amz-version-id",
    response.headers.get("x-openstack-request-id") || "",
  );
  s3ResponseHeaders.set("x-amz-id-2", response.headers.get("x-trans-id") || "");
  s3ResponseHeaders.set(
    "x-amz-request-id",
    response.headers.get("x-openstack-request-id") || "",
  );
  s3ResponseHeaders.set("ETag", response.headers.get("etag") || "");

  let lastModified = response.headers.get("last-modified");
  if (!lastModified) {
    lastModified = "1970-01-01T00:00:00.000Z"; // default value for entries with no date
  }
  const s3ResponseBody = `
    <CopyObjectResult>
      <LastModified>${formatRFC3339Date(lastModified)}</LastModified>
      <ETag>${response.headers.get("etag")}</ETag>
    </CopyObjectResult>
    `;

  const s3Response = new Response(s3ResponseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: s3ResponseHeaders,
  });

  return s3Response;
}
