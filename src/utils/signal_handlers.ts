import { SAVE_TASK_STORE_TIMEOUT } from "../constants/time.ts";
import { HeraldContext } from "../types/mod.ts";
import { getLogger } from "./log.ts";

async function handleTermSignal(ctx: HeraldContext) {
  const taskStore = ctx.taskStore;
  const logger = getLogger(import.meta);
  logger.info(
    "Received TERM signal. Clearing resources, saving state, and exiting gracefully...",
  );
  try {
    // Allow time for task queue save and cleanup
    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, SAVE_TASK_STORE_TIMEOUT)), // 30s timeout
      new Promise((resolve, reject) => {
        logger.info("Received Save Task Queue Signal");
        taskStore.syncToRemote().then((res) => {
          logger.info("Task Queue Synced to Remote Successfully");
          resolve(res);
        }).catch((error) => {
          logger.error(`Failed to sync task queue: ${error}`);
          reject(error);
        });
      }),
    ]);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    Deno.exit(1);
  } finally {
    Deno.exit(0);
  }
}

export function registerSignalHandlers(ctx: HeraldContext) {
  Deno.addSignalListener("SIGTERM", () => handleTermSignal(ctx));
}
