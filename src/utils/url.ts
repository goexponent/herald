import { HonoRequest } from "@hono/hono";
import { appConfig } from "../config/mod.ts";
import { getLogger } from "./log.ts";
import { signRequestV4 } from "./signer.ts";
import { AUTH_HEADER, HOST_HEADER } from "../constants/headers.ts";

const logger = getLogger(import.meta);

/**
 * Forwards a request with timeouts. Before the request is forwarded, the incoming request will be verified using Signature V4 and the request will be signed to match the Signature expected by the object storage server.
 *
 * @param request - The request to be forwarded.
 * @returns A promise that resolves to the response of the forwarded request.
 */
export function forwardRequestWithTimeouts(
  request: HonoRequest,
) {
  const forwardRequest = async () => {
    const destUrl = new URL(appConfig.s3_config.endpoint);

    const redirect = new URL(request.url);
    redirect.hostname = destUrl.hostname;
    redirect.protocol = destUrl.protocol;
    redirect.port = destUrl.port;
    redirect.host = destUrl.host;

    const rawRequest = request.raw;
    let body: ReadableStream<Uint8Array> | undefined = undefined;

    // Check if the body exists and read it
    if (rawRequest.body) {
      body = rawRequest.body; // Deno body is already a ReadableStream
    }

    logger.debug(`Original URL: ${request.url}`);
    logger.debug(`Modified URL: ${redirect.toString()}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.header())) {
      headers.append(key, value);
    }
    headers.set(HOST_HEADER, destUrl.host);
    headers.delete(AUTH_HEADER);

    const forwardReq = new Request(redirect, {
      method: request.method,
      headers,
      body: body,
    });

    const signed = await signRequestV4(forwardReq);

    const newRequest = new Request(redirect, {
      method: signed.method,
      headers: signed.headers,
      body: signed.body ?? undefined,
    });

    // Need to add the url, or content-length gets set to -1
    const response = await fetch(redirect, newRequest);
    const clonedResponse = new Response(response.body, response);
    return clonedResponse;
  };

  return retryWithExponentialBackoff(forwardRequest, 5, 100, 10000);
}

// Utility function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to handle exponential backoff retries
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 100,
  maxDelay = 10000,
): Promise<T> {
  let attempt = 0;
  let delayDuration = initialDelay;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries - 1) {
        throw error;
      }

      await delay(delayDuration);
      delayDuration = Math.min(delayDuration * 2, maxDelay);
      attempt++;
    }
  }

  // TODO: replace with HTTPException
  throw new Error("Exhausted all retries");
}
