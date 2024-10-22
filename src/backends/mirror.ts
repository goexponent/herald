import { Context } from "@hono/hono";
import {
  BackupS3Config,
  BackupSwiftConfig,
  S3BucketConfig,
  SwiftBucketConfig,
} from "../config/types.ts";
import { Mutex } from "./mutex.ts";
import { getLogger } from "../utils/log.ts";

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
}

export interface WorkerEvent {
  data: MirrorTask;
}

const taskQueue: MirrorTask[] = [];
const workers: Worker[] = [];

// Instantiate a mutex
const queueMutex = new Mutex();

export async function enqueueTask(task: MirrorTask) {
  const release = await queueMutex.lock();
  try {
    taskQueue.push(task);
  } finally {
    release(); // Ensure release is called after operation
  }
}

export async function getNextTask(): Promise<MirrorTask | undefined> {
  const release = await queueMutex.lock();
  try {
    return taskQueue.shift();
  } finally {
    release(); // Ensure release is called after operation
  }
}

export async function moveTaskToLast() {
  const release = await queueMutex.lock();
  try {
    if (taskQueue.length > 0) {
      const task = taskQueue.shift();
      taskQueue.push(task!);
    }
  } finally {
    release(); // Ensure release is called after operation
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
    };
    await enqueueTask(task);
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

function handleWorkerMessage(event: MessageEvent, worker: Worker) {
  const { type } = event.data;

  if (type === "requestTask") {
    if (taskQueue.length > 0) {
      const task = taskQueue.shift();
      worker.postMessage({ type: "task", task });
    } else {
      // No tasks left, maybe signal to terminate or idle
      worker.postMessage({ type: "noMoreTasks" });
    }
  }
}

// Create a new worker
function createWorker(): Worker {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
  });
  worker.onmessage = (event) => handleWorkerMessage(event, worker);
  return worker;
}

// Add a worker to the pool
function addWorker() {
  const worker = createWorker();
  workers.push(worker);
}

function processTaskQueue() {
  while (taskQueue.length > 0 && workers.length > 0) {
    const task = taskQueue.shift();
    // TODO: using limited ammount of workers, per backend numbers
    const worker = workers.pop();

    if (worker && task) {
      worker.postMessage({ type: "task", task });
    }
  }
}

// Function to check the queue and process tasks
function startPolling() {
  setInterval(() => {
    logger.debug(`Checking queue: ${taskQueue.length} task(s) available.`);
    if (taskQueue.length > 0) {
      addWorker(); // Add a worker if tasks are available
      processTaskQueue(); // Dispatch tasks to workers
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// TODO: remove
startPolling();
