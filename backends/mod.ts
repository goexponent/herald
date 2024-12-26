import { Context } from "@hono/hono";
import { getBucketConfig } from "../config/loader.ts";
import { HTTPException } from "../types/http-exception.ts";
import {
  getBackendDef,
  S3BucketConfig,
  SwiftBucketConfig,
} from "../config/mod.ts";
import { s3Resolver } from "./s3/mod.ts";
import { extractRequestInfo } from "../utils/mod.ts";
import { swiftResolver } from "./swift/mod.ts";

export async function resolveHandler(c: Context) {
  const reqInfo = extractRequestInfo(c.req);
  const { bucket } = reqInfo;

  if (!bucket) {
    throw new HTTPException(400, {
      message: "Bucket not specified in the request",
    });
  }

  const bucketConfig = getBucketConfig(bucket);
  if (!bucketConfig) {
    throw new HTTPException(404, {
      message: `Bucket Configuration missing for bucket: ${bucket}`,
    });
  }

  const backendName = bucketConfig.backend;
  const bucketBackendDef = getBackendDef(backendName);
  if (!bucketBackendDef) {
    throw new HTTPException(404, {
      message:
        `Backend Configuration missing for backend with name: ${backendName} under bucket: ${bucket}`,
    });
  }

  const protocol = bucketBackendDef.protocol;
  if (protocol === "s3") {
    const s3Config = bucketConfig as S3BucketConfig;
    return await s3Resolver(c, s3Config);
  } else if (protocol === "swift") {
    const swiftConfig = bucketConfig as SwiftBucketConfig;
    return await swiftResolver(c, swiftConfig);
  } else {
    throw new HTTPException(400, { message: "Unsupported Backend Protocol" });
  }
}
