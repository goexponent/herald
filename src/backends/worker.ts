import { getLogger } from "../utils/log.ts";
import { processTask } from "./mirror.ts";
import { MirrorTask } from "./types.ts";

const logger = getLogger(import.meta.url);

self.onmessage = onMsg;

async function onMsg(msg: MessageEvent<MirrorTask>) {
  const task = msg.data;
  logger.info(`Processing task: ${task.command}`);
  await processTask(task);
}
