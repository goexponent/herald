import { SAVETASKQUEUE } from "../constants/message.ts";
import { getLogger } from "../utils/log.ts";

self.postMessage(`${name} Worker Started`);
function handleTermSignal() {
  const logger = getLogger(import.meta);
  logger.info(
    "Received TERM signal. Clearing resources, saving state, and exiting gracefully...",
  );
  // Add your resource clearing and state saving logic here
  self.postMessage(SAVETASKQUEUE);

  Deno.exit(0);
}

Deno.addSignalListener("SIGTERM", handleTermSignal);
