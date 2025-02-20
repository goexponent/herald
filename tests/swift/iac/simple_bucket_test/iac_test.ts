import { testTerraform } from "../../../utils/iac.ts";
import * as path from "std/path";
import { testDir } from "../../../utils/mod.ts";
import { deleteBucketIfExists, getS3Client } from "../../../../utils/s3.ts";

Deno.test("Tofu resource provisioning - Swift backend", async (t) => {
  const s3 = getS3Client({
    endpoint: "http://localhost:8000",
    region: "local",
    forcePathStyle: true,
    credentials: {
      accessKeyId: "minio",
      secretAccessKey: "password",
    },
  });
  await t.step(async function cleanup() {
    await deleteBucketIfExists(s3, "swift-test");
  });
  const tfDir = path.join(testDir, "swift_backend/iac/simple_bucket_test");
  await testTerraform(tfDir, t);
});
