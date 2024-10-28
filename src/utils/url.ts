import { S3Config } from "../config/mod.ts";
import { getLogger } from "./log.ts";
import { signRequestV4 } from "./signer.ts";
import { AUTH_HEADER, HOST_HEADER } from "../constants/headers.ts";
import { HTTPException } from "../types/http-exception.ts";
import { s3ReqParams } from "../constants/query-params.ts";
import { createXmlErrorResponse } from "./error.ts";

const logger = getLogger(import.meta);

/**
 * Forwards a request with timeouts. Before the request is forwarded, the incoming request will be verified using Signature V4 and the request will be signed to match the Signature expected by the object storage server.
 *
 * @param request - The request to be forwarded.
 * @returns A promise that resolves to the response of the forwarded request.
 */
export async function forwardRequestWithTimeouts(
  request: Request,
  config: S3Config,
) {
  const forwardRequest = async () => {
    const destUrl = new URL(config.endpoint);

    const redirect = new URL(request.url);
    redirect.hostname = destUrl.hostname;
    redirect.protocol = destUrl.protocol;
    redirect.port = destUrl.port;
    redirect.host = destUrl.host;

    let body: ReadableStream<Uint8Array> | undefined = undefined;

    // Check if the body exists and read it
    if (request.body) {
      body = request.body; // Deno body is already a ReadableStream
    }

    logger.debug(`Original URL: ${request.url}`);
    logger.debug(`Modified URL: ${redirect.toString()}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      headers.append(key, value);
    }
    headers.set(HOST_HEADER, destUrl.host);
    headers.delete(AUTH_HEADER);

    const forwardReq = new Request(redirect, {
      method: request.method,
      headers,
      body: body,
    });

    const signed = await signRequestV4(forwardReq, config);

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

  return await retryWithExponentialBackoff(
    forwardRequest,
    5,
    100,
    10000,
    config.bucket,
  );
}

export function getBodyFromReq(
  req: Request,
): ReadableStream<Uint8Array> | undefined {
  if (req.body) {
    return req.body;
  }
}

// Utility function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to handle exponential backoff retries
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 100,
  maxDelay = 1000,
  resource: string,
): Promise<T> {
  let attempt = 0;
  let delayDuration = initialDelay;
  let err;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries - 1) {
        logger.critical(error);
        err = error;
        attempt++;
        // FIXME: throw error;
      }

      await delay(delayDuration);
      delayDuration = Math.min(delayDuration * 2, maxDelay);
      attempt++;
    }
  }

  const errResponse = createXmlErrorResponse(err, 502, resource);
  throw new HTTPException(errResponse.status, {
    res: errResponse,
  });
}

export function areQueryParamsSupported(queryParams: string[]): boolean {
  for (const param of queryParams) {
    if (!s3ReqParams.has(param)) {
      return false;
    }
  }

  return true;
}

export function formatParams(queryParams: string[]): string {
  return queryParams.join(", ");
}

/**
 * Checks if the given string is a valid IP address (IPv4 or IPv6).
 *
 * @param ip - The string to check.
 * @returns True if the string is a valid IP address, false otherwise.
 */
export function isIP(ip: string): boolean {
  // IPv4 regex pattern
  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex pattern
  const ipv6Pattern =
    /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}
