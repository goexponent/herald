import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
  S3ClientConfig,
} from "aws-sdk/client-s3";

export function getS3Client(config: S3ClientConfig) {
  // deno-lint-ignore require-await no-explicit-any
  const loggingMiddleware = (next: any) => async (args: any) => {
    const { request } = args;
    // deno-lint-ignore no-console
    console.log("Request Details:", {
      url:
        `${request.protocol}//${request.hostname}:${request.port}${request.path}`,
      method: request.method,
      hostname: request.hostname,
      path: request.path,
      headers: request.headers,
    });
    return next(args);
  };

  const s3 = new S3Client({
    ...config,
  });
  const envVar = Deno.env.get("log_level");
  const debug = envVar === "DEBUG";
  if (debug) {
    s3.middlewareStack.add(loggingMiddleware, {
      step: "finalizeRequest",
    });
  }

  return s3;
}

export async function deleteBucketIfExists(
  client: S3Client,
  bucketName: string,
) {
  while (true) {
    const list = await listObjects(client, bucketName);
    if (list == null) {
      return;
    }
    if (list.length === 0) {
      break;
    }

    for (const { Key } of list) {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: Key! }),
      );
    }
  }

  const deleteCommand = new DeleteBucketCommand({ Bucket: bucketName });
  await client.send(deleteCommand);
}

export async function listObjects(client: S3Client, bucketName: string) {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    const res = await client.send(listCommand);
    return res.Contents ?? [];
  } catch (e) {
    if (e.name === "NoSuchBucket") {
      return null;
    }
    throw e;
  }
}

export async function setupBucket(client: S3Client, bucketName: string) {
  await deleteBucketIfExists(client, bucketName);
  const createBucket = new CreateBucketCommand({
    Bucket: bucketName,
  });
  await client.send(createBucket);
}
