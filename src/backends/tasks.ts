import { kv } from "./task_store.ts";
import { MirrorTask } from "./types.ts";

export function taskHandler() {
  kv.listenQueue(async (task: MirrorTask) => {
    // logger.info(`Processing task: ${task.command}`);
    // await processTask(task);
    const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
      type: "module",
      name: "kv worker",
    });
    const promise = new Promise((resolve, reject) => {
      worker.onmessage = (evt: MessageEvent<MirrorTask>) => {
        const res = evt.data;
        resolve(res);
      };
      worker.onmessageerror = (evt) => {
        reject(evt.data);
      };
      worker.onerror = (err) => {
        reject(err);
      };
    });
    worker.postMessage(task);
    const _resp = await promise;
    worker.terminate();
  });
}

taskHandler();
