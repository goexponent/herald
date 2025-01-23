import { SAVETASKQUEUE } from "../constants/message.ts";
import { SAVE_TASK_STORE_TIMEOUT } from "../constants/time.ts";
import { getLogger } from "../utils/log.ts";

self.postMessage(`${name} Worker Started`);
async function handleTermSignal() {
  const logger = getLogger(import.meta);
  logger.info(
    "Received TERM signal. Clearing resources, saving state, and exiting gracefully...",
  );
  try {
    self.postMessage(SAVETASKQUEUE);
    // Allow time for task queue save and cleanup
    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, SAVE_TASK_STORE_TIMEOUT)), // 30s timeout
      new Promise((resolve) => {
        self.onmessage = (evt) => {
          if (evt.data === "SAVE_COMPLETE") resolve(null);
        };
      }),
    ]);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
  } finally {
    Deno.exit(0);
  }
}

Deno.addSignalListener("SIGTERM", handleTermSignal);
