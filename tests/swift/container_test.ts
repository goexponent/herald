import { CreateBucketCommand, S3Client } from "aws-sdk/client-s3";
import { assertEquals } from "std/assert/mod.ts";
import { loggingMiddleware, testConfig } from "../utils/mod.ts";
import { proxyUrl } from "../../src/config/mod.ts";

const containerName = "swift_test";

const s3 = new S3Client({
  ...testConfig,
  endpoint: proxyUrl,
});
s3.middlewareStack.add(loggingMiddleware, {
  step: "finalizeRequest",
});

Deno.test(async function createContainer() {
  const command = new CreateBucketCommand({
    Bucket: containerName,
  });

  const result = await s3.send(command);
  assertEquals(201, result.$metadata.httpStatusCode);
});

// Deno.test(async function deleteContainer() {
//   const command = new DeleteBucketCommand({
//     Bucket: containerName,
//   });

//   const result = await s3.send(command);
//   assertEquals(204, result.$metadata.httpStatusCode);
// });
