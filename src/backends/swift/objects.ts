import { getLogger, reportToSentry } from "../../utils/log.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getAuthTokenWithTimeouts, getSwiftRequestHeaders } from "./auth.ts";
import {
  getBodyFromReq,
  retryWithExponentialBackoff,
} from "../../utils/url.ts";
import { formatRFC3339Date, toS3XmlContent } from "./utils/mod.ts";
import { NoSuchBucketException } from "../../constants/errors.ts";
import { SwiftConfig } from "../../config/types.ts";
import { S3_COPY_SOURCE_HEADER } from "../../constants/headers.ts";
import { s3Utils } from "../../utils/mod.ts";
import { prepareMirrorRequests } from "../mirror.ts";
import { Bucket } from "../../buckets/mod.ts";
import { s3Resolver } from "../s3/mod.ts";
import { swiftResolver } from "./mod.ts";
import { HeraldContext } from "../../types/mod.ts";
const logger = getLogger(import.meta);

export async function putObject(
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Put Object Request...");
  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    return new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config: SwiftConfig = bucketConfig.config as SwiftConfig;
  const mirrorOperation = bucketConfig.hasReplicas();

  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "PUT",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(
    fetchFunc,
  );

  if (response instanceof Error) {
    logger.warn(`Put Object Failed: ${response.message}`);
    return response;
  }

  if (response.status !== 201) {
    const errMessage = `Put Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Put Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        ctx,
        req,
        bucketConfig,
        "putObject",
      );
    }
  }

  return response;
}

export async function getObject(
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Get Object Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    return new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config: SwiftConfig = bucketConfig.config as SwiftConfig;

  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "GET",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };

  let response = await retryWithExponentialBackoff(
    fetchFunc,
    bucketConfig.hasReplicas() || bucketConfig.isReplica ? 1 : 3,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    logger.warn(
      `Get Object Failed on Primary Bucket: ${bucketConfig.bucketName}`,
    );
    logger.warn("Trying on Replicas...");
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(ctx, req, replica)
        : await swiftResolver(ctx, req, replica);
      if (res instanceof Error) {
        logger.warn(`Get Object Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Get Object Failed: ${response.message}`);
    return response;
  }

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
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Delete Object Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    return new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config: SwiftConfig = bucketConfig.config as SwiftConfig;
  const mirrorOperation = bucketConfig.hasReplicas();

  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "DELETE",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };

  let response = await retryWithExponentialBackoff(
    fetchFunc,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(ctx, req, replica)
        : await swiftResolver(ctx, req, replica);
      if (res instanceof Error) {
        logger.warn(`Delete Object Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Delete Object Failed: ${response.message}`);
    return response;
  }

  if (response.status !== 204) {
    const errMessage = `Delete Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Delete Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        ctx,
        req,
        bucketConfig,
        "deleteObject",
      );
    }
  }

  return response;
}

export async function listObjects(
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Get List of Objects Request...");

  const { bucket, queryParams: query } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    return new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config = bucketConfig.config as SwiftConfig;
  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
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

  let response = await retryWithExponentialBackoff(
    fetchFunc,
    bucketConfig.hasReplicas() || bucketConfig.isReplica ? 1 : 3,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    logger.warn(
      `List Objects Failed on Primary Bucket: ${bucketConfig.bucketName}`,
    );
    logger.warn("Trying on Replicas...");
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(ctx, req, replica)
        : await swiftResolver(ctx, req, replica);
      if (res instanceof Error) {
        logger.warn(
          `Get List of Objects Failed on Replica: ${replica.name}`,
        );
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Get List of Objects Failed: ${response.message}`);
    return response;
  }

  if (response.status === 404) {
    logger.warn(`Get List of Objects Failed: ${response.statusText}`);
    throw NoSuchBucketException();
  } else {
    logger.info(`Get List of Objects Successful: ${response.statusText}`);
  }

  const delimiter = query.delimiter ? query.delimiter[0] : null;
  const prefix = query.prefix ? query.prefix[0] : null;
  const maxKeys = query["max-keys"] ? Number(query["max-keys"][0]) : null;
  const continuationToken = query["continuation-token"]
    ? query["continuation-token"][0]
    : null;
  const formattedResponse = await toS3XmlContent(
    response,
    bucket,
    delimiter,
    prefix,
    maxKeys ?? 1000,
    continuationToken,
  );
  return formattedResponse;
}

export async function getObjectMeta(
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Get Object Meta Request...");

  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config = bucketConfig.config as SwiftConfig;
  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${object}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "GET",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };

  let response = await retryWithExponentialBackoff(
    fetchFunc,
    bucketConfig.hasReplicas() || bucketConfig.isReplica ? 1 : 3,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    logger.warn(
      `Get Object Meta Failed on Primary Bucket: ${bucketConfig.bucketName}`,
    );
    logger.warn("Trying on Replicas...");
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(ctx, req, replica)
        : await swiftResolver(ctx, req, replica);
      if (res instanceof Error) {
        logger.warn(`Get bucket ACL Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Get Object Meta Failed: ${response.message}`);
    return response;
  }

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
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Head Object Request...");

  const { bucket, objectKey } = s3Utils.extractRequestInfo(req);
  if (!bucket || !objectKey) {
    return new HTTPException(404, {
      message: "Bucket or object information missing from the request",
    });
  }

  const config = bucketConfig.config as SwiftConfig;
  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}/${objectKey}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };

  let response = await retryWithExponentialBackoff(
    fetchFunc,
    bucketConfig.hasReplicas() || bucketConfig.isReplica ? 1 : 3,
  );

  if (response instanceof Error && bucketConfig.hasReplicas()) {
    logger.warn(
      `Head Object Failed on Primary Bucket: ${bucketConfig.bucketName}`,
    );
    logger.warn("Trying on Replicas...");
    for (const replica of bucketConfig.replicas) {
      const res = replica.typ === "ReplicaS3Config"
        ? await s3Resolver(ctx, req, replica)
        : await swiftResolver(ctx, req, replica);
      if (res instanceof Error) {
        logger.warn(`Head object Failed on Replica: ${replica.name}`);
        continue;
      }
      response = res;
    }
  }

  if (response instanceof Error) {
    logger.warn(`Head object Failed: ${response.message}`);
    return response;
  }

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
  ctx: HeraldContext,
  req: Request,
  bucketConfig: Bucket,
): Promise<Response | Error | HTTPException> {
  logger.info("[Swift backend] Proxying Copy Object Request...");
  const { bucket, objectKey: object } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    return new HTTPException(400, {
      message: "Bucket information missing from the request",
    });
  }

  const config: SwiftConfig = bucketConfig.config as SwiftConfig;
  const mirrorOperation = bucketConfig.hasReplicas();

  const res = await getAuthTokenWithTimeouts(
    config,
  );
  if (res instanceof Error) {
    return res;
  }

  const { storageUrl: swiftUrl, token: authToken } = res;
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
  const response = await retryWithExponentialBackoff(
    fetchFunc,
  );

  if (response instanceof Error) {
    logger.warn(`Copy Object Failed: ${response.message}`);
    return response;
  }

  if (response.status !== 201) {
    const errMessage = `Copy Object Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Copy Object Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        ctx,
        req,
        bucketConfig,
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
