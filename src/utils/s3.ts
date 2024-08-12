import { S3 } from "aws-sdk/client-s3";
import { appConfig } from "../config/mod.ts";
import { HonoRequest } from "@hono/hono";
import {
  methodSchema,
  RequestMeta,
  URLFormatStyle,
  urlFormatStyle,
} from "./types.ts";

export function getS3Client() {
  return new S3(appConfig.s3_config);
}

function extractMethod(request: HonoRequest) {
  const parseResult = methodSchema.safeParse(request.method);

  if (!parseResult.success) {
    throw new Error(`Error Parsing Request Method: ${request.method}`);
  }

  const method = parseResult.data;
  return method;
}

function extractBucketName(request: HonoRequest): string | undefined {
  const urlFormat = getUrlFormat(request);

  if (urlFormat === urlFormatStyle.Values.VirtualHosted) {
    const host = request.header("host");

    const elts = host!.split(".");
    return elts.at(0);
  }

  const path = request.path;
  const elts = path.split("/");

  if (elts.length < 2) {
    return;
  }

  const bucketName = elts.at(1);
  return bucketName;
}

function extractObjectKey(request: HonoRequest): string | undefined {
  const urlFormat = getUrlFormat(request);
  const keyIndex = urlFormat === urlFormatStyle.Values.VirtualHosted ? 1 : 2;

  const path = request.path;
  const nodes = path.split("/");
  const objectKey = nodes.at(keyIndex);

  return objectKey;
}

/**
 * Retrieves the URL format style based on the provided HonoRequest object.
 *
 * @param request - The HonoRequest object containing the request information.
 * @returns The URL format style (VirtualHosted or Path).
 * @throws Error if the request does not have a valid host.
 */
function getUrlFormat(request: HonoRequest): URLFormatStyle {
  const host = request.header("host");
  if (!host) {
    // TODO: change to HTTPException.
    throw new Error(`Invalid request: ${request.url}`);
  }

  const elts = host.split(".");
  if (elts.length >= 2) {
    return urlFormatStyle.Values.VirtualHosted;
  }

  return urlFormatStyle.Values.Path;
}

/**
 * Extracts the request information from the given HonoRequest object. Tje request
 *
 * @param request - The HonoRequest object containing the request information.
 * @returns {RequestMeta} The extracted request metadata.
 */
export function extractRequestInfo(request: HonoRequest): RequestMeta {
  const bucketName = extractBucketName(request);
  const objectKey = bucketName ? extractObjectKey(request) : null;
  const urlFormat = getUrlFormat(request);
  const method = extractMethod(request);

  const reqMeta: RequestMeta = {
    bucket: bucketName,
    objectKey,
    urlFormat,
    method,
  };

  return reqMeta;
}
