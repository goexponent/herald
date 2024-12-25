import { Context } from "@hono/hono";
import { SwiftBucketConfig } from "../../config/mod.ts";
import { getAuthTokenWithTimeouts, getSwiftRequestHeaders } from "./auth.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { s3Utils } from "../../utils/mod.ts";
import { getLogger, reportToSentry } from "../../utils/log.ts";
import {
  getBodyFromReq,
  retryWithExponentialBackoff,
} from "../../utils/url.ts";
import { MethodNotAllowedException } from "../../constants/errors.ts";
import { XML_CONTENT_TYPE } from "../../constants/query-params.ts";
import { isBucketConfig, SwiftConfig } from "../../config/types.ts";
import { prepareMirrorRequests } from "../mirror.ts";
import { HTTP_STATUS_CODES } from "../../constants/http_status_codes.ts";

const logger = getLogger(import.meta);

function createBucketSuccessResponse(bucketName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Location>${bucketName}</Location>
</CreateBucketConfiguration>`;
}

export async function createBucket(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Create Bucket Request...");

  const { bucket } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (bucketConfig.backups) {
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
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "PUT",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    const errMesage = `Create bucket Failed: ${response.statusText}`;
    logger.warn(errMesage);
    reportToSentry(errMesage);
  } else {
    logger.info(`Create bucket Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as SwiftBucketConfig,
        "createBucket",
      );
    }
  }

  const successResponse = createBucketSuccessResponse(bucket);
  const clonedHeaders = new Headers(response.headers);
  clonedHeaders.set("Content-Type", XML_CONTENT_TYPE);
  const newResponse = new Response(successResponse, {
    status: response.status,
    statusText: response.statusText,
    headers: clonedHeaders,
  });

  return newResponse;
}

export async function deleteBucket(
  req: Request,
  bucketConfig: SwiftConfig | SwiftBucketConfig,
): Promise<Response | undefined> {
  logger.info("[Swift backend] Proxying Delete Bucket Request...");

  const { bucket } = s3Utils.extractRequestInfo(req);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  let config: SwiftConfig;
  let mirrorOperation = false;
  if (isBucketConfig(bucketConfig)) {
    config = bucketConfig.config;
    if (bucketConfig.backups) {
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
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "Delete",
      headers: headers,
      body: getBodyFromReq(req),
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status !== 204) {
    const errMessage = `Delete bucket Failed: ${response.statusText}`;
    logger.warn(errMessage);
    reportToSentry(errMessage);
  } else {
    logger.info(`Delete bucket Successful: ${response.statusText}`);
    if (mirrorOperation) {
      await prepareMirrorRequests(
        req,
        bucketConfig as SwiftBucketConfig,
        "deleteBucket",
      );
    }
  }

  return response;
}

export async function getBucketAcl(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Handling Get Bucket ACL Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    const errMessage = `Get bucket ACL Failed: ${response.statusText}`;
    logger.warn(errMessage);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  // Extract relevant headers from Swift response
  const owner = response.headers.get("X-Container-Meta-Owner") || "SwiftOwner";
  const readACL = response.headers.get("X-Container-Read") || "";
  const writeACL = response.headers.get("X-Container-Write") || "";

  // Construct S3-like ACL response based on Swift headers
  const aclResponse = `<?xml version="1.0" encoding="UTF-8"?>
<AccessControlPolicy xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Owner>
    <ID>${owner}</ID>
    <DisplayName>${owner}</DisplayName>
  </Owner>
  <AccessControlList>
    <Grant>
      <Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">
        <ID>${owner}</ID>
        <DisplayName>${owner}</DisplayName>
      </Grantee>
      <Permission>FULL_CONTROL</Permission>
    </Grant>
    ${
    readACL
      ? `<Grant><Grantee xsi:type="Group"><URI>${readACL}</URI></Grantee><Permission>READ</Permission></Grant>`
      : ""
  }
    ${
    writeACL
      ? `<Grant><Grantee xsi:type="Group"><URI>${writeACL}</URI></Grantee><Permission>WRITE</Permission></Grant>`
      : ""
  }
  </AccessControlList>
</AccessControlPolicy>`;

  return new Response(aclResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export async function getBucketVersioning(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Handling Get Bucket Versioning Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    logger.warn(`Get bucket versioning Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  // Swift doesn't support bucket versioning like S3, so we return an empty configuration
  const versioningResponse = `<?xml version="1.0" encoding="UTF-8"?>
<VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</VersioningConfiguration>`;

  return new Response(versioningResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketAccelerate(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Accelerate Request...");

  // Swift doesn't have an equivalent to S3's transfer acceleration
  // We'll return a response indicating acceleration is not configured
  const accelerateResponse = `<?xml version="1.0" encoding="UTF-8"?>
<AccelerateConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</AccelerateConfiguration>`;

  return new Response(accelerateResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketLogging(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Logging Request...");

  // Swift doesn't have built-in bucket logging like S3
  // We'll return a response indicating logging is not enabled
  const loggingResponse = `<?xml version="1.0" encoding="UTF-8"?>
<BucketLoggingStatus xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</BucketLoggingStatus>`;

  return new Response(loggingResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketLifecycle(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Lifecycle Request...");

  // Swift doesn't have a direct equivalent to S3's lifecycle policies
  // We'll return a response indicating no lifecycle rules are configured
  const lifecycleResponse = `<?xml version="1.0" encoding="UTF-8"?>
<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</LifecycleConfiguration>`;

  return new Response(lifecycleResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketWebsite(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Website Request...");

  // Swift doesn't have built-in static website hosting like S3
  // We'll return a response indicating that website hosting is not configured
  const websiteResponse = `<?xml version="1.0" encoding="UTF-8"?>
<WebsiteConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</WebsiteConfiguration>`;

  return new Response(websiteResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketPayment(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Payment Request...");

  // Swift doesn't have a concept of requester pays like S3
  // We'll return a MethodNotAllowed response
  throw MethodNotAllowedException("GET");
}

export async function getBucketEncryption(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Handling Get Bucket Encryption Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    logger.warn(`Get bucket encryption Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  // Check if Swift container has encryption enabled
  const encryptionEnabled =
    response.headers.get("X-Container-Meta-Encryption-Type") !== null;

  const encryptionResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ServerSideEncryptionConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  ${
    encryptionEnabled
      ? `
  <Rule>
    <ApplyServerSideEncryptionByDefault>
      <SSEAlgorithm>AES256</SSEAlgorithm>
    </ApplyServerSideEncryptionByDefault>
  </Rule>
  `
      : ""
  }
</ServerSideEncryptionConfiguration>`;

  return new Response(encryptionResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export async function headBucket(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Proxying Head Bucket Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    logger.warn(`Head bucket Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  logger.info(`Head bucket Successful: ${response.statusText}`);

  // Create a new response with only the headers
  const headResponse = new Response(null, {
    status: HTTP_STATUS_CODES.OK,
    headers: response.headers,
  });

  return headResponse;
}

export function getBucketCors(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket CORS Request...");

  // Swift doesn't have a direct equivalent to S3's CORS configuration
  // We'll return an empty CORS configuration
  const corsResponse = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</CORSConfiguration>`;

  return new Response(corsResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketReplication(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Replication Request...");

  // Swift doesn't have a built-in replication feature like S3
  // We'll return an empty replication configuration
  const replicationResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ReplicationConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</ReplicationConfiguration>`;

  return new Response(replicationResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export function getBucketObjectLock(
  _c: Context,
  _bucketConfig: SwiftBucketConfig,
): Response {
  logger.info("[Swift backend] Handling Get Bucket Object Lock Request...");

  // Swift doesn't have an equivalent to S3's Object Lock feature
  // We'll return an empty Object Lock configuration
  const objectLockResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ObjectLockConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
</ObjectLockConfiguration>`;

  return new Response(objectLockResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export async function getBucketTagging(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Handling Get Bucket Tagging Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    logger.warn(`Get bucket tagging Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  // Swift doesn't have a direct equivalent to S3's tagging
  // We'll check for custom metadata that could be used as tags
  const tags: { Key: string; Value: string }[] = [];
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase().startsWith("x-container-meta-tag-")) {
      const tagKey = key.slice("x-container-meta-tag-".length);
      tags.push({ Key: tagKey, Value: value });
    }
  }

  const taggingResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <TagSet>
    ${
    tags.map((tag) => `
    <Tag>
      <Key>${tag.Key}</Key>
      <Value>${tag.Value}</Value>
    </Tag>`).join("")
  }
  </TagSet>
</Tagging>`;

  return new Response(taggingResponse, {
    status: 200,
    headers: { "Content-Type": XML_CONTENT_TYPE },
  });
}

export async function getBucketPolicy(
  c: Context,
  bucketConfig: SwiftBucketConfig,
): Promise<Response> {
  logger.info("[Swift backend] Handling Get Bucket Policy Request...");

  const { bucket } = s3Utils.extractRequestInfo(c.req.raw);
  if (!bucket) {
    throw new HTTPException(404, {
      message: "Bucket information missing from the request",
    });
  }

  const { storageUrl: swiftUrl, token: authToken } =
    await getAuthTokenWithTimeouts(bucketConfig.config);
  const headers = getSwiftRequestHeaders(authToken);
  const reqUrl = `${swiftUrl}/${bucket}`;

  const fetchFunc = async () => {
    return await fetch(reqUrl, {
      method: "HEAD",
      headers: headers,
    });
  };
  const response = await retryWithExponentialBackoff(fetchFunc, bucket);

  if (response.status >= 300) {
    logger.warn(`Get bucket policy Failed: ${response.statusText}`);
    throw new HTTPException(response.status, { message: response.statusText });
  }

  // Swift doesn't have a direct equivalent to S3's bucket policies
  // We'll return a simple policy based on the container's ACLs
  const readACL = response.headers.get("X-Container-Read") || "";
  const writeACL = response.headers.get("X-Container-Write") || "";

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicRead",
        Effect: readACL.includes(".r:*") ? "Allow" : "Deny",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
      {
        Sid: "PublicWrite",
        Effect: writeACL.includes(".r:*") ? "Allow" : "Deny",
        Principal: "*",
        Action: ["s3:PutObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  const policyResponse = JSON.stringify(policy, null, 2);

  return new Response(policyResponse, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
