import { getLogger, setupLoggers } from "../utils/log.ts";
import { processTask } from "./mirror.ts";
import { MirrorTask } from "./types.ts";
import { configInit } from "../config/mod.ts";
import { inWorker } from "../utils/mod.ts";
import { HeraldContext } from "../types/mod.ts";

if (inWorker()) {
  await configInit();
  setupLoggers();
}

interface MirrorMessage {
  task: MirrorTask;
  ctx: HeraldContext;
}

self.onmessage = onMsg;
self.postMessage(`Worker started ${self.name}`);

async function onMsg(msg: MessageEvent<MirrorMessage>) {
  const task = msg.data.task;
  const ctx = msg.data.ctx;
  const logger = getLogger(import.meta);

  logger.info(
    `Processing task: ${task.command}`,
  );
  await processTask(ctx, task);
  self.postMessage("Task completed");
}
