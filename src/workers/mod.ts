import taskStore from "../backends/task_store.ts";
import { initializeTaskHandler } from "../backends/tasks.ts";
import { SAVETASKQUEUE } from "../constants/message.ts";
import { getLogger } from "../utils/log.ts";

async function initalizeSignalHandler() {
  logger.info("Registering Worker: Signal Handler");
  const worker = new Worker(
    new URL("./signal_handlers.ts", import.meta.url).href,
    {
      type: "module",
      name: "Signal Handler Worker",
    },
  );
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
  logger.info("Worker: Signal Handler Registered");
  worker.onmessage = async (evt: MessageEvent<string>) => {
    const msg = evt.data;
    if (msg === SAVETASKQUEUE) {
      logger.info("Received Save Task Queue Signal");
      const _ = await taskStore.syncToRemote();
      logger.info("Task Queue Synced to Remote Successfully");
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
