import taskStore from "../backends/task_store.ts";
import { initializeTaskHandler } from "../backends/tasks.ts";
import { SAVETASKQUEUE } from "../constants/message.ts";
import { getLogger } from "../utils/log.ts";

const MAX_RETRIES = 3;
let worker: Worker | null = null;

function cleanupWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

async function initalizeSignalHandler() {
  logger.info("Registering Worker: Signal Handler");
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      cleanupWorker();
      worker = new Worker(
        new URL("./signal_handlers.ts", import.meta.url).href,
        {
          type: "module",
          name: "Signal Handler Worker",
        },
      );
      break;
    } catch (error) {
      retries++;
      logger.error(
        `Failed to initialize worker (attempt ${retries}): ${error}`,
      );
      if (retries === MAX_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
  if (worker === null) {
    throw new Error("Failed to initialize worker");
  }
  const workerCreation = () => {
    return new Promise((resolve, reject) => {
      worker!.onmessage = (evt: MessageEvent<string>) => {
        const res = evt.data;
        logger.info(res);
        resolve(res);
      };
      worker!.onmessageerror = (evt) => {
        reject(evt.data);
      };
      worker!.onerror = (err) => {
        reject(err);
      };
    });
  };
  await workerCreation();
  logger.info("Worker: Signal Handler Registered");
  worker.onmessage = async (evt: MessageEvent<string>) => {
    const msg = evt.data;
    if (msg === SAVETASKQUEUE) {
      logger.info("Received Save Task Queue Signal");
      try {
        await taskStore.syncToRemote();
        logger.info("Task Queue Synced to Remote Successfully");
        worker?.postMessage("SAVE_COMPLETE");
      } catch (error) {
        logger.error(`Failed to sync task queue: ${error}`);
      }
    }
  };
  worker.onmessageerror = (evt) => {
    logger.error(evt.data);
  };
  worker.onerror = (err) => {
    logger.info(err);
  };
}

const logger = getLogger(import.meta);
export async function registerWorkers() {
  logger.info("Registering Workers...");

  // k8s signal handler worker
  await initalizeSignalHandler();

  // Mirror task handler workers
  logger.info("Registering Workers: Task Handler");
  await initializeTaskHandler();
  logger.info("Workers: Task Handler Workers Registered");
}
