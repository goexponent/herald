import { getLogger } from "../utils/log.ts";
import { MirrorTask } from "./mirror.ts";

const logger = getLogger(import.meta);

// Listen for messages from the main script
self.onmessage = (event) => {
  const { type, task } = event.data;

  switch (type) {
    case "task":
      processTask(task);
      // After processing, request another task
      self.postMessage({
        type: "requestTask",
        workerIndex: event.data.workerIndex,
      });
      break;

    case "noMoreTasks":
      logger.debug("No more tasks.");
      self.close(); // Optionally stop the worker if no more tasks
      break;
  }
};

// Function to process a task
function processTask(task: MirrorTask) {
  if (task) {
    logger.debug(`Processing task with ID: ${task.command}`);
    // Simulate processing time
    setTimeout(() => {
      logger.debug(`Completed task with ID: ${task.command}`);
    }, 1000);
  }
}
