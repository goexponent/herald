import { initializeTaskHandler } from "../backends/tasks.ts";
import { getLogger } from "../utils/log.ts";

const logger = getLogger(import.meta);
export async function registerWorkers() {
  logger.info("Registering Workers...");

  // Mirror task handler workers
  logger.info("Registering Workers: Task Handler");
  await initializeTaskHandler();
  logger.info("Workers: Task Handler Workers Registered");
}
