import { Context } from "@hono/hono";
import {
  BackupS3Config,
  BackupSwiftConfig,
  S3BucketConfig,
  SwiftBucketConfig,
} from "../config/types.ts";
import { getLogger } from "../utils/log.ts";
import { forwardRequestWithTimeouts } from "../utils/url.ts";
import { extractRequestInfo } from "../utils/mod.ts";
import { getObject } from "./s3/objects.ts";
import { putObject as swiftPutObject } from "./swift/objects.ts";

const logger = getLogger(import.meta);

type MirrorableCommands = "putObject" | "deleteObject" | "copyObject";

/**
 * Interface representing a task to mirror a specific operation between two bucket configurations.
 */
export interface MirrorTask {
  mainBucketConfig: S3BucketConfig | SwiftBucketConfig;
  backupBucketConfig: BackupS3Config | BackupSwiftConfig;
  command: MirrorableCommands;
  originalRequest: Request;
  nonce: string;
}

export interface WorkerEvent {
  data: MirrorTask;
}

// Create a new worker
function createWorker(): Worker {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
  });
  return worker;
}

// Add a worker to the pool
function addWorker() {
  const worker = createWorker();
  workers.push(worker);
}
const workers: Worker[] = [];
const workersCount = 5;
for (let i = 0; i < workersCount; i++) {
  addWorker();
}

// Open a KV store
const kv = await Deno.openKv();

export async function enqueueMirrorTask(task: MirrorTask) {
  const nonce = crypto.randomUUID(); // Unique identifier for the task
  const taskKey = ["nonces", nonce];
  task.nonce = nonce;

  // Atomic transaction to add the task to the queue
  await kv.atomic()
    .check({ key: taskKey, versionstamp: null }) // Ensure the task is not already enqueued
    .enqueue(task)
    .set(taskKey, true) // Enqueue the task
    .commit();
}

kv.listenQueue(async (task: MirrorTask) => {
  const nonce = await kv.get(["nonces", task.nonce]);
  if (nonce.value === null) {
    // This messaged was already processed
    return;
  }

  // Atomic transaction to mark task as processed
  const success = await kv.atomic()
    .check({ key: nonce.key, versionstamp: nonce.versionstamp })
    .delete(nonce.key) // Remove task from the queue
    .commit();

  if (success) {
    logger.info("Processing task:", task);
    await sendToWorker(task);
  } else {
    // If the transaction failed, it means the task has already been processed or is being processed
    logger.warn(`Task ${nonce.key} already processed or invalid.`);
  }
});

async function sendToWorker(task: MirrorTask) {
  const worker = workers.pop();
  if (worker) {
    worker.postMessage({ type: "task", task });

    worker.onmessage = (event) => {
      if (event.data.type === "taskComplete") {
        logger.debug(`Task complete: ${Deno.inspect(event.data.task)}`);
        workers.push(worker);
      }
    };
  } else {
    logger.debug("No workers available.");
    logger.debug("Re-queueing task.");
    await enqueueMirrorTask(task);
  }
}

export async function prepareMirrorRequests(
  c: Context,
  bucketConfig: S3BucketConfig | SwiftBucketConfig,
  command: MirrorableCommands,
) {
  logger.info("[S3 backend] mirroring requests...");

  const backupBuckets = bucketConfig.backups!;
  for (const backupConfig of backupBuckets) {
    const task: MirrorTask = {
      mainBucketConfig: bucketConfig,
      backupBucketConfig: backupConfig,
      command: command,
      originalRequest: new Request(c.req.raw),
      nonce: "",
    };
    await enqueueMirrorTask(task);
  }
}

export function copyObject(
  request: Request,
  backupConfig: BackupS3Config,
): Request {
  const copySource = `${backupConfig.config.bucket}/${
    request.url.split("/").pop()
  }`;
  const copyObjectUrl =
    `${backupConfig.config.endpoint}/${backupConfig.config.bucket}/${
      request.url.split("/").pop()
    }`;

  const copyObjectHeaders = new Headers(request.headers);
  copyObjectHeaders.set("x-amz-copy-source", copySource);

  const copyObjectRequest = new Request(copyObjectUrl, {
    method: "GET",
    headers: copyObjectHeaders,
  });

  return copyObjectRequest;
}

function getDownloadS3Url(originalRequest: Request) {
  const reqMeta = extractRequestInfo(originalRequest);
  const url = new URL(originalRequest.url);
  if (reqMeta.urlFormat === "Path") {
    return `${url.hostname}/${reqMeta.bucket}/${reqMeta.objectKey}`;
  }

  return `${reqMeta.bucket}.${url.hostname}/${reqMeta.objectKey}`;
}

export async function copyObjectsFromMainToBackup(
  primary: S3BucketConfig | SwiftBucketConfig,
  replica: BackupS3Config | BackupSwiftConfig,
  originalRequest: Request,
) {
  // TODO: what if the object is not found?
  // TODO: what if the object already exists in replica
  if (primary.typ === "S3BucketConfig") {
    if (replica.typ === "BackupS3Config") {
      const copyRequest = copyObject(originalRequest, replica);
      const response = await forwardRequestWithTimeouts(
        copyRequest,
        replica.config,
      );
      if (response.ok) {
        logger.debug(
          `Object copied from ${primary.config.bucket} to ${replica.config.bucket}`,
        );
      } else {
        logger.error(
          `Failed to copy object from ${primary.config.bucket} to ${replica.config.bucket}`,
        );
      }
    } else {
      // get object from s3
      const getObjectUrl = getDownloadS3Url(originalRequest);
      const getObjectRequest = new Request(getObjectUrl, {
        headers: originalRequest.headers,
        method: "GET",
      });
      const response = await getObject(getObjectRequest, primary);
      const putToSwiftRequest = new Request(originalRequest.url, {
        body: response.body,
      });
      await swiftPutObject(putToSwiftRequest, replica.config);
    }
  }
}

export function processTask(task: MirrorTask) {
  const { command } = task;
  switch (command) {
    case "putObject":
    case "deleteObject":
    case "copyObject":
  }
}
