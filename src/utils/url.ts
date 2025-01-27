import { globalConfig, S3Config } from "../config/mod.ts";
import { getLogger, reportToSentry } from "./log.ts";
import { signRequestV4 } from "./signer.ts";
import { AUTH_HEADER, HOST_HEADER } from "../constants/headers.ts";
import { HTTPException } from "../types/http-exception.ts";
import { s3ReqParams } from "../constants/query-params.ts";
import { createXmlErrorResponse } from "./error.ts";
import { ReplicaConfig, SwiftConfig } from "../config/types.ts";
import { s3Resolver } from "../backends/s3/mod.ts";
import { swiftResolver } from "../backends/swift/mod.ts";

const logger = getLogger(import.meta);

/**
 * Returns the redirect URL for the given original URL and target URL.
 * @param originalUrl
 * @param targetUrl
 * @returns The redirect URL.
 */
export function getRedirectUrl(originalUrl: string, targetUrl: string): URL {
  const destUrl = new URL(targetUrl);

  const redirect = new URL(originalUrl);
  redirect.hostname = destUrl.hostname;
  redirect.protocol = destUrl.protocol;
  redirect.port = destUrl.port;
  redirect.host = destUrl.host;

  return redirect;
}

export function getReplicas(bucketName: string) {
  const replicas: ReplicaConfig[] = [];
  for (const replica of globalConfig.replicas) {
    const replicaBucket = replica.typ === "ReplicaS3Config"
      ? replica.config.bucket
      : replica.config.container;
    if (replicaBucket === bucketName) {
      replicas.push(replica);
    }
  }

  return replicas;
}

/**
 * Checks if the content length of the request is non-zero.
 *
 * @param request - The request to check.
 * @returns True if the content length is non-zero, false otherwise.
 */
export function isContentLengthNonZero(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  return contentLength !== null && parseInt(contentLength, 10) > 0;
}

/**
 * Forwards a request with timeouts. Before the request is forwarded, the incoming request will be verified using Signature V4 and the request will be signed to match the Signature expected by the object storage server.
 *
 * @param request - The request to be forwarded.
 * @returns A promise that resolves to the response of the forwarded request.
 */
export async function forwardRequestWithTimeouts(
  request: Request,
  s3Config: S3Config,
  readReplicaOp = false,
  isReplica = false,
) {
  const forwardRequest = async (config: S3Config) => {
    const redirect = getRedirectUrl(request.url, config.endpoint);

    let body: ReadableStream<Uint8Array> | undefined = undefined;

    // Check if the body exists and read it
    if (request.body && isContentLengthNonZero(request)) {
      body = request.body; // Deno body is already a ReadableStream
    }

    logger.debug(`Original URL: ${request.url}`);
    logger.debug(`Modified URL: ${redirect.toString()}`);

    const headers = new Headers();
    for (const [key, value] of request.headers) {
      headers.append(key, value);
    }
    headers.set(HOST_HEADER, redirect.host);
    headers.delete(AUTH_HEADER);
    const toBeRemovedHeaders = [
      "baggage",
      "cdn-loop",
      "cf-connecting-ip",
      "cf-ipcountry",
      "cf-ray",
      "cf-visitor",
      "sentry-trace",
      "x-forwarded-for",
      "x-forwarded-host",
      "x-forwarded-port",
      "x-forwarded-proto",
      "x-forwarded-scheme",
      "x-original-forwarded-for",
      "x-real-ip",
      "x-request-id",
      "x-scheme",
      // "content-length",
      "content-md5",
    ];
    for (const key of toBeRemovedHeaders) {
      headers.delete(key);
    }

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

  const replicas = getReplicas(s3Config.bucket);
  const result = replicas.length > 0 && readReplicaOp
    ? await retryWithExponentialBackoffReplica(
      forwardRequest,
      () => {},
      s3Config,
      isReplica ? 0 : 3,
      100,
      10000,
      request,
      replicas,
    )
    : await retryWithExponentialBackoff(
      forwardRequest,
      () => {},
      s3Config,
      isReplica ? 0 : 3,
      100,
      10000,
      isReplica,
    );

  return result;
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
  s3Fn: (config: S3Config) => Promise<T> | void,
  swiftFn: () => Promise<T> | void,
  config: S3Config | SwiftConfig,
  retries = 3,
  initialDelay = 100,
  maxDelay = 1000,
  isReplica = false,
): Promise<T> {
  let attempt = 0;
  let delayDuration = initialDelay;
  let err: Error = new Error("Unknown error");

  while (attempt < retries) {
    try {
      if (config.typ === "S3Config") {
        return await s3Fn(config)!;
      }

      return await swiftFn()!;
    } catch (error) {
      if (attempt >= retries - 1) {
        logger.critical(error);
        reportToSentry(error as Error);
        err = error as Error;
        attempt++;
      }

      await delay(delayDuration);
      delayDuration = Math.min(delayDuration * 2, maxDelay);
      attempt++;
    }
  }

  if (isReplica) {
    throw err;
  }

  const resource = config.typ === "S3Config" ? config.bucket : config.container;
  const errResponse = createXmlErrorResponse(err, 502, resource);
  throw new HTTPException(errResponse.status, {
    res: errResponse,
  });
}

// Function to handle exponential backoff retries
export async function retryWithExponentialBackoffReplica<T>(
  s3Fn: (config: S3Config) => Promise<T> | void,
  swiftFn: () => Promise<T> | void,
  config: S3Config | SwiftConfig,
  retries = 3,
  initialDelay = 100,
  maxDelay = 1000,
  request: Request,
  replicas: ReplicaConfig[],
): Promise<T> {
  let attempt = 0;
  let delayDuration = initialDelay;
  let err: Error = new Error("Unknown error");

  while (attempt < retries) {
    try {
      if (config.typ === "S3Config") {
        return await s3Fn(config)!;
      }

      return await swiftFn()!;
    } catch (error) {
      while (replicas.length > 0) {
        const replica = replicas.pop()!;
        try {
          if (replica.typ === "ReplicaS3Config") {
            return await s3Resolver(request, replica) as T;
          } else {
            return await swiftResolver(request, replica) as T;
          }
        } catch (_err) {
          // continue to the next replica available
          continue;
        }
      }

      if (attempt >= retries - 1) {
        logger.critical(error);
        reportToSentry(error as Error);
        err = error as Error;
        attempt++;
      }

      await delay(delayDuration);
      delayDuration = Math.min(delayDuration * 2, maxDelay);
      attempt++;
    }
  }

  const resource = config.typ === "S3Config" ? config.bucket : config.container;
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

export function serializeRequest(req: Request): Record<string, unknown> {
  return {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    // body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null,
  };
}

// deno-lint-ignore no-explicit-any
export function deserializeToRequest(data: Record<string, any>): Request {
  return new Request(data.url, {
    method: data.method,
    headers: new Headers(data.headers),
    // body: data.method !== 'GET' && data.method !== 'HEAD' ? data.body : null,
  });
}

export async function retryFetchWithTimeout<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 100,
  maxDelay = 1000,
  timeout = 10000,
): Promise<T | Error> {
  let attempt = 0;
  let delayDuration = initialDelay;
  let err: Error = new Error("Unknown error");

  while (attempt < retries) {
    try {
      const result = await Promise.race<[Promise<T>, Promise<Error>]>([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeout)
        ),
      ]);
      return result;
    } catch (error) {
      if (attempt >= retries - 1) {
        logger.critical(error);
        reportToSentry(error as Error);
        err = error as Error;
        attempt++;
      }

      await delay(delayDuration);
      delayDuration = Math.min(delayDuration * 2, maxDelay);
      attempt++;
    }
  }

  return err;
}
