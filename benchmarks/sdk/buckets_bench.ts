import { deleteBucketIfExists, getS3Client } from "../../utils/s3.ts";
import { CreateBucketCommand, DeleteBucketCommand } from "aws-sdk/client-s3";

const bucketName = "bench";

Deno.bench("Create Bucket", async (b) => {
  const s3 = getS3Client(bucketName);

  await deleteBucketIfExists(s3, bucketName);

  const createBucket = new CreateBucketCommand({
    Bucket: bucketName,
  });

  b.start();

  const _res = await s3.send(createBucket);

  b.end();
  s3.destroy();
});

Deno.bench("Delete Bucket", async (b) => {
  const s3 = getS3Client(bucketName);

  await deleteBucketIfExists(s3, bucketName);
  const createBucket = new CreateBucketCommand({
    Bucket: bucketName,
  });
  const _res = await s3.send(createBucket);

  const deleteBucket = new DeleteBucketCommand({
    Bucket: bucketName,
  });

  b.start();

  await s3.send(deleteBucket);

  b.end();
  s3.destroy();
});
