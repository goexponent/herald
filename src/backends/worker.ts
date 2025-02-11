import { getLogger, setupLoggers } from "../utils/log.ts";
import { processTask } from "./mirror.ts";
import { MirrorTask } from "./types.ts";
import { configInit } from "../config/mod.ts";
import { inWorker } from "../utils/mod.ts";
import { HeraldContext } from "../types/mod.ts";
import { TASK_QUEUE_DB } from "../constants/message.ts";
import { TASK_TIMEOUT } from "../constants/time.ts";

if (inWorker()) {
  await configInit();
  setupLoggers();
}

interface StartMessage {
  ctx: HeraldContext;
}

self.onmessage = onMsg;
self.postMessage(`Worker started ${self.name}`);

async function onMsg(msg: MessageEvent<StartMessage>) {
  const logger = getLogger(import.meta);
  logger.info(`Worker started listening to tasks for bucket: ${name}`);
  const ctx = msg.data.ctx;
  const dbName = `${name}_${TASK_QUEUE_DB}`;
  const kv = await Deno.openKv(dbName);
  kv.listenQueue(async (task: MirrorTask) => {
    logger.info(`Dequeued task: ${task.command}`);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Task timeout")), TASK_TIMEOUT);
      });

      const _ = await Promise.race([
        processTask(ctx, task),
        timeoutPromise,
      ]);

      logger.info(`Task completed: ${task.command}`);
    } catch (error) {
      logger.error(`Task failed: ${(error as Error).message}`);
    }
  });
}
