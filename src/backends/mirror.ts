import { HeraldContext } from "./../types/mod.ts";
import {
  ReplicaConfig,
  ReplicaS3Config,
  ReplicaSwiftConfig,
  S3BucketConfig,
  S3Config,
  SwiftBucketConfig,
  SwiftConfig,
} from "../config/types.ts";
import { getLogger, reportToSentry } from "../utils/log.ts";
import { s3Utils } from "../utils/mod.ts";
import * as s3 from "./s3/objects.ts";
import * as s3_buckets from "./s3/buckets.ts";
import * as swift_buckets from "./swift/buckets.ts";
import * as swift from "./swift/objects.ts";
import { S3_COPY_SOURCE_HEADER } from "../constants/headers.ts";
import { MirrorableCommands, MirrorTask } from "./types.ts";
import { deserializeToRequest, serializeRequest } from "../utils/url.ts";
import { bucketStore, globalConfig } from "../config/mod.ts";
import { TASK_QUEUE_DB } from "../constants/message.ts";

const logger = getLogger(import.meta);

export function getBucketFromTask(task: MirrorTask) {
  return task.mainBucketConfig.typ === "S3BucketConfig"
    ? task.mainBucketConfig.config.bucket
    : task.mainBucketConfig.config.container;
}

function getStorageKey(config: S3Config | SwiftConfig) {
  if ("auth_url" in config) {
    return `swift:${config.auth_url}/${config.region}`;
  }

  return `s3:${config.endpoint}/${config.region}`;
}

export async function enqueueMirrorTask(ctx: HeraldContext, task: MirrorTask) {
  const bucket = getBucketFromTask(task);
  const kv = await Deno.openKv(`${bucket}_${TASK_QUEUE_DB}`);
  const lockedStorages = ctx.taskStore.lockedStorages;
  const nonce = crypto.randomUUID(); // Unique identifier for the task
  task.nonce = nonce;
  logger.debug(
    `Enqueing task: ${task.command} for primary: ${task.mainBucketConfig.typ} to replica: ${task.backupBucketConfig.typ}`,
  );

  // Atomic transaction to add the task to the queue
  const storageKey = getStorageKey(task.backupBucketConfig.config);
  const currentCount = lockedStorages.get(storageKey) || 0;
  lockedStorages.set(storageKey, currentCount + 1);

  await kv.enqueue(task);
  logger.debug(
    `Task enqueued: ${task.command} for primary: ${task.mainBucketConfig.typ} to replica: ${task.backupBucketConfig.typ}`,
  );
}

export async function prepareMirrorRequests(
  ctx: HeraldContext,
  req: Request,
  bucketConfig: S3BucketConfig | SwiftBucketConfig,
  command: MirrorableCommands,
) {
  logger.info("[S3 backend] mirroring requests...");

  const replicaBuckets: ReplicaConfig[] = [];
  for (const replica of globalConfig.replicas) {
    const primaryBucket = bucketConfig.typ === "S3BucketConfig"
      ? bucketConfig.config.bucket
      : bucketConfig.config.container;

    const replicaBucket = replica.typ === "ReplicaS3Config"
      ? replica.config.bucket
      : replica.config.container;

    if (replicaBucket === primaryBucket) {
      replicaBuckets.push(replica);
    }
  }
  for (const backupConfig of replicaBuckets) {
    const task: MirrorTask = {
      mainBucketConfig: bucketConfig,
      backupBucketConfig: backupConfig,
      command: command,
      originalRequest: serializeRequest(req),
      nonce: "",
      bucket: bucketConfig.typ === "S3BucketConfig"
        ? bucketConfig.config.bucket
        : bucketConfig.config.container,
    };
    await enqueueMirrorTask(ctx, task);
  }
}

function _getCopyObjectRequest(
  // This is a PutObject request
  request: Request,
  backupConfig: ReplicaS3Config,
): Request {
  const { bucket, objectKey } = s3Utils.extractRequestInfo(request);
  const copySource = `/${bucket}/${objectKey}`;

  const copyObjectUrl =
    `${backupConfig.config.endpoint}/${backupConfig.config.bucket}/${
      request.url.split("/").pop()
    }`;

  const copyObjectHeaders = new Headers(request.headers);
  copyObjectHeaders.delete(S3_COPY_SOURCE_HEADER);
  copyObjectHeaders.set(S3_COPY_SOURCE_HEADER, copySource);

  const copyObjectRequest = new Request(copyObjectUrl, {
    method: "GET",
    headers: copyObjectHeaders,
  });

  return copyObjectRequest;
}

function getDownloadS3Url(originalRequest: Request, primary: S3BucketConfig) {
  const reqMeta = s3Utils.extractRequestInfo(originalRequest);

  if (reqMeta.urlFormat === "Path") {
    return `${primary.config.endpoint}/${reqMeta.bucket}/${reqMeta.objectKey}`;
  }

  return `${reqMeta.bucket}.${primary.config.endpoint}/${reqMeta.objectKey}`;
}

function generateCreateBucketXml(region: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>${region}</LocationConstraint></CreateBucketConfiguration>`;
}

function generateS3GetObjectHeaders(
  bucketConfig: S3Config,
): Headers {
  const headers = new Headers();
  headers.set("Host", `${bucketConfig.endpoint}`);
  headers.set("x-amz-date", new Date().toISOString());
  headers.set("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
  headers.set(
    "Authorization",
    `AWS4-HMAC-SHA256 Credential=${bucketConfig.credentials.accessKeyId}/${bucketConfig.region}/s3/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256, Signature=${
      generateSignature(bucketConfig)
    }`,
  );
  return headers;
}

function generateSignature(_bucketConfig: S3Config): string {
  // Implement the AWS Signature Version 4 signing process here
  // This is a placeholder function and should be replaced with actual signature generation logic
  return "signature";
}

export async function mirrorPutObject(
  ctx: HeraldContext,
  primary: S3BucketConfig | SwiftBucketConfig,
  replica: ReplicaS3Config | ReplicaSwiftConfig,
  originalRequest: Request,
): Promise<void> {
  if (primary.typ === "S3BucketConfig") {
    // get object from s3
    const getObjectUrl = getDownloadS3Url(originalRequest, primary);
    const getObjectRequest = new Request(getObjectUrl, {
      headers: generateS3GetObjectHeaders(primary.config),
      method: "GET",
    });

    const primaryBucket = bucketStore.buckets.find((bucket) =>
      bucket.name === primary.config.bucket
    )!;
    const response = await s3.getObject(ctx, getObjectRequest, primaryBucket);

    if (response instanceof Error) {
      const errMessage = "Get object failed during mirroring to replica bucket";
      logger.error(
        errMessage,
      );
      reportToSentry(errMessage);
      return;
    }

    if (!response.ok) {
      const errMesage =
        `Get object failed during mirroing to replica bucket: ${response.statusText}`;
      logger.error(
        errMesage,
      );
      reportToSentry(errMesage);
      return;
    }

    if (replica.typ === "ReplicaS3Config") {
      // put object to s3

      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      const putToS3Request = new Request(originalRequest.url, {
        method: originalRequest.method,
        body: response.body,
        headers: originalRequest.headers,
      });
      await s3.putObject(ctx, putToS3Request, replicaBucket);
    } else {
      // put object to swift
      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      const putToSwiftRequest = new Request(originalRequest.url, {
        body: response.body,
        method: originalRequest.method,
        redirect: originalRequest.redirect,
        headers: originalRequest.headers,
      });
      await swift.putObject(ctx, putToSwiftRequest, replicaBucket);
    }
    return;
  }

  // get object from swift
  const getObjectRequest = new Request(originalRequest.url, {
    method: "GET",
    headers: generateS3GetObjectHeaders(
      {
        endpoint: primary.config.auth_url,
        region: primary.config.region,
        bucket: primary.config.container,
        credentials: {
          accessKeyId: primary.config.credentials.username,
          secretAccessKey: primary.config.credentials.password,
        },
        forcePathStyle: true, // FIXME
        typ: "S3Config",
      },
    ),
  });
  const primaryBucket = bucketStore.buckets.find((bucket) =>
    bucket.name === primary.config.container
  )!;
  const response = await swift.getObject(ctx, getObjectRequest, primaryBucket);

  if (response instanceof Error) {
    const errMessage = "Get object failed during mirroring to replica bucket";
    logger.error(
      errMessage,
    );
    reportToSentry(errMessage);
    return;
  }

  if (!response.ok) {
    const errMessage = "Get object failed during mirroring to replica bucket";
    logger.error(
      errMessage,
    );
    reportToSentry(errMessage);
    return;
  }

  // this path means primary is swift
  if (replica.typ === "ReplicaS3Config") {
    // put object to s3
    const putToS3Request = new Request(originalRequest.url, {
      body: response.body,
      headers: originalRequest.headers,
      method: "PUT",
    });
    if (response.headers.has("accept-ranges")) {
      putToS3Request.headers.set(
        "accept-ranges",
        response.headers.get("accept-ranges")!,
      );
    }
    if (response.headers.has("content-length")) {
      putToS3Request.headers.set(
        "content-length",
        response.headers.get("content-length")!,
      );
    }
    if (response.headers.has("content-type")) {
      putToS3Request.headers.set(
        "content-type",
        response.headers.get("content-type")!,
      );
    }
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await s3.putObject(ctx, putToS3Request, replicaBucket);
  } else {
    const putToSwiftRequest = new Request(originalRequest.url, {
      body: response.body,
      method: "PUT",
      headers: originalRequest.headers,
    });
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await swift.putObject(ctx, putToSwiftRequest, replicaBucket);
  }
}

/**
 * This function mirrors a delete object request to a replica bucket.
 * @param replica
 * @param originalRequest
 */
export async function mirrorDeleteObject(
  ctx: HeraldContext,
  replica: ReplicaS3Config | ReplicaSwiftConfig,
  originalRequest: Request,
): Promise<void> {
  const primaryBucket = bucketStore.buckets.find((bucket) =>
    bucket.name === replica.name
  )!;
  switch (replica.typ) {
    case "ReplicaS3Config": {
      const headers = new Headers(originalRequest.headers);
      headers.set(
        "Authorization",
        `AWS4-HMAC-SHA256 Credential=${replica.config.credentials.accessKeyId}/${replica.config.region}/s3/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256, Signature=${
          generateSignature(replica.config)
        }`,
      );
      const modifiedRequest = new Request(originalRequest.url, {
        method: originalRequest.method,
        headers: headers,
      });
      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      await s3.deleteObject(ctx, modifiedRequest, replicaBucket);
      break;
    }
    case "ReplicaSwiftConfig": {
      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      await swift.deleteObject(ctx, originalRequest, replicaBucket);
      break;
    }
    default:
      throw new Error("Invalid replica config type");
  }
}

/**
 * This function mirrors a copy object request to a replica bucket.
 * @param replica
 * @param originalRequest
 */
export async function mirrorCopyObject(
  ctx: HeraldContext,
  replica: ReplicaS3Config | ReplicaSwiftConfig,
  originalRequest: Request,
): Promise<void> {
  const primaryBucket = bucketStore.buckets.find((bucket) =>
    bucket.name === replica.name
  )!;
  switch (replica.typ) {
    case "ReplicaS3Config": {
      const headers = new Headers(originalRequest.headers);
      headers.set(
        "Authorization",
        `AWS4-HMAC-SHA256 Credential=${replica.config.credentials.accessKeyId}/${replica.config.region}/s3/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256, Signature=${
          generateSignature(replica.config)
        }`,
      );
      const modifiedRequest = new Request(originalRequest.url, {
        method: originalRequest.method,
        headers: headers,
      });
      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      await s3.copyObject(ctx, modifiedRequest, replicaBucket);
      break;
    }
    case "ReplicaSwiftConfig": {
      const replicaBucket = primaryBucket.getReplica(replica.name)!;
      await swift.copyObject(ctx, originalRequest, replicaBucket);
      break;
    }
    default:
      throw new Error("Invalid replica config type");
  }
}

export async function mirrorCreateBucket(
  ctx: HeraldContext,
  originalRequest: Request,
  replica: ReplicaS3Config | ReplicaSwiftConfig,
): Promise<void> {
  const primaryBucket = bucketStore.buckets.find((bucket) =>
    bucket.name === replica.name
  )!;
  if (replica.typ === "ReplicaS3Config") {
    const modifiedRequest = new Request(originalRequest.url, {
      method: originalRequest.method,
      headers: originalRequest.headers,
      body: generateCreateBucketXml(replica.config.region),
    });
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await s3_buckets.createBucket(ctx, modifiedRequest, replicaBucket);
  } else {
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await swift_buckets.createBucket(ctx, originalRequest, replicaBucket);
  }
}

export async function mirrorDeleteBucket(
  ctx: HeraldContext,
  originalRequest: Request,
  replica: ReplicaS3Config | ReplicaSwiftConfig,
) {
  const primaryBucket = bucketStore.buckets.find((bucket) =>
    bucket.name === replica.name
  )!;
  if (replica.typ === "ReplicaS3Config") {
    const headers = new Headers(originalRequest.headers);
    headers.set(
      "Authorization",
      `AWS4-HMAC-SHA256 Credential=${replica.config.credentials.accessKeyId}/${replica.config.region}/s3/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256, Signature=${
        generateSignature(replica.config)
      }`,
    );
    const modifiedRequest = new Request(originalRequest.url, {
      method: originalRequest.method,
      headers: headers,
    });
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await s3_buckets.deleteBucket(ctx, modifiedRequest, replicaBucket);
  } else {
    const replicaBucket = primaryBucket.getReplica(replica.name)!;
    await swift_buckets.deleteBucket(ctx, originalRequest, replicaBucket);
  }
}

export async function processTask(ctx: HeraldContext, task: MirrorTask) {
  const {
    command,
    originalRequest: req,
    backupBucketConfig,
    mainBucketConfig,
  } = task;
  const originalRequest = deserializeToRequest(req);
  switch (command) {
    case "putObject":
      await mirrorPutObject(
        ctx,
        mainBucketConfig,
        backupBucketConfig,
        originalRequest,
      );
      break;
    case "deleteObject":
      await mirrorDeleteObject(ctx, backupBucketConfig, originalRequest);
      break;
    case "copyObject":
      await mirrorCopyObject(ctx, backupBucketConfig, originalRequest);
      break;
    case "createBucket":
      await mirrorCreateBucket(ctx, originalRequest, backupBucketConfig);
      break;
    case "deleteBucket":
      await mirrorDeleteBucket(ctx, originalRequest, backupBucketConfig);
      break;
  }
}
