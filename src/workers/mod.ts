import { initializeTaskHandler } from "../backends/tasks.ts";
import { HeraldContext } from "../types/mod.ts";
import { getLogger } from "../utils/log.ts";

const logger = getLogger(import.meta);
export async function registerWorkers(ctx: HeraldContext) {
  logger.info("Registering Workers...");

  // Mirror task handler workers
  logger.info("Registering Workers: Task Handler");
  await initializeTaskHandler(ctx);
  logger.info("Workers: Task Handler Workers Registered");
}
