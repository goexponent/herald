import { globalConfig } from "../config/mod.ts";
import { HeraldContext } from "../types/mod.ts";
import { getLogger } from "../utils/log.ts";
import { getBucketFromTask } from "./mirror.ts";
import { MirrorTask } from "./types.ts";

const logger = getLogger(import.meta);
const TASK_TIMEOUT = 240000; // 240 seconds

async function createNewWorker(bucket: string) {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
    name: `bucket ${bucket} kv worker`,
  });
  // Hack to get around the fact that the worker is not yet ready to receive messages
  const workerCreation = () => {
    return new Promise((resolve, reject) => {
      worker.onmessage = (evt: MessageEvent<string>) => {
        const res = evt.data;
        logger.info(res);
        resolve(res);
      };
      worker.onmessageerror = (evt) => {
        reject(evt.data);
      };
      worker.onerror = (err) => {
        reject(err);
      };
    });
  };
  await workerCreation();
  return worker;
}

async function setupWorkers() {
  const buckets = Object.keys(globalConfig.buckets);
  const workers = new Map<string, Worker>();
  for (const bucket of buckets) {
    const worker = await createNewWorker(bucket);
    workers.set(bucket, worker);
  }

  return workers;
}

let workers: Map<string, Worker>;

export function taskHandler(ctx: HeraldContext) {
  const taskStore = ctx.taskStore;
  const kv = taskStore.taskQueue;
  kv.listenQueue(async (task: MirrorTask) => {
    logger.info(`Dequeued task: ${task.command}`);

    const taskBucket = getBucketFromTask(task);
    const worker = workers.get(taskBucket);
    if (!worker) {
      logger.info(`Worker for bucket ${taskBucket} busy`);
      logger.info(
        `Re-enqueueing task: ${task.command} to process when worker is available`,
      );
      // FIXME: this will cause for the order of tasks for a bucket to be lost
      setTimeout(() => {
        kv.enqueue(task);
      }, 10000); // Re-enqueue task after 10 seconds
      return;
    }
    workers.delete(taskBucket);

    const processMessageBackFromWorker = () => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (evt: MessageEvent<string>) => {
          const res = evt.data;
          if (res === "Task completed") {
            workers.set(taskBucket, worker);
            logger.info(`Task completed: ${task.command}`);
          }
          resolve(res);
        };
        worker.onmessageerror = (evt) => {
          workers.set(taskBucket, worker);
          logger.error(`Task failed: ${evt.data}`);
          reject(evt.data);
        };
        worker.onerror = (err) => {
          workers.set(taskBucket, worker);
          logger.error(`Task failed: ${err}`);
          reject(err);
        };
      });
    };

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Task timeout")), TASK_TIMEOUT);
      });

      worker.postMessage(task);
      const _ = await Promise.race([
        processMessageBackFromWorker(),
        timeoutPromise,
      ]);

      workers.set(taskBucket, worker);
      logger.info(`Task completed: ${task.command}`);
    } catch (error) {
      logger.error(`Task failed: ${(error as Error).message}`);
      worker.terminate(); // Clean up failed worker
      // Create new worker for the bucket
      workers.set(taskBucket, await createNewWorker(taskBucket));
    }
  });
}

export async function initializeTaskHandler(ctx: HeraldContext) {
  workers = await setupWorkers();
  taskHandler(ctx);
}
