import taskStore from "../backends/task_store.ts";
import { initializeTaskHandler } from "../backends/tasks.ts";
import { SAVETASKQUEUE } from "../constants/message.ts";
import { getLogger } from "../utils/log.ts";

const logger = getLogger(import.meta);
export async function registerWorkers() {
  logger.info("Registering Workers...");

  // k8s signal handler worker
  logger.debug("Registering Worker: Signal Handler");
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
  await new Promise((resolve, reject) => {
    worker.onmessage = async (evt: MessageEvent<string>) => {
      const msg = evt.data;
      if (msg === SAVETASKQUEUE) {
        logger.info("Received Save Task Queue Signal");
        const res = await taskStore.syncToRemote();
        logger.info("Task Queue Synced to Remote Successfully");
        resolve(res);
      }
    };
    worker.onmessageerror = (evt) => {
      reject(evt.data);
    };
    worker.onerror = (err) => {
      reject(err);
    };
  });

  // Mirror task handler workers
  logger.info("Registering Worker: Task Handler");
  await initializeTaskHandler();
  logger.info("Worker: Task Handler Registered");
}
