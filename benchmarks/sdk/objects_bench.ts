import { basename } from "std/path/basename";
import { createTempFile, createTempStream } from "../../utils/file.ts";
import { getS3Client, listObjects, setupBucket } from "../../utils/s3.ts";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "aws-sdk/client-s3";
import { getRandomInt, getRandomUUID } from "../../src/utils/crypto.ts";
import { Upload } from "aws-sdk/lib-storage";

const bucketName = "bench";
const s3Config = {
  credentials: {
    accessKeyId: "minio",
    secretAccessKey: "password",
  },
  endpoint: "http://localhost:8000",
  region: "local",
  forcePathStyle: true,
};

export async function uploadMultipleFiles(s3: S3Client, bucketName: string) {
  const numOfFiles = getRandomInt(20, 30);
  for (let i = 0; i <= numOfFiles; i++) {
    const { stream: fileStream, fileName: _, size } = await createTempStream(2);
    const fileName = getRandomUUID();

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ContentLength: size,
      },
    });

    await upload.done();
  }
}

Deno.bench("upload whole object", async (b) => {
  const filePath = await createTempFile(5); // 5 MB file
  const file = await Deno.readFile(filePath);
  const fileName = basename(filePath);
  const s3 = getS3Client(s3Config);

  await setupBucket(s3, bucketName);

  const uploadFile = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file,
  });

  b.start();

  const _res = await s3.send(uploadFile);

  b.end();
  s3.destroy();
});

const uploadInChunk = async (fileSizeInMb: number, b: Deno.BenchContext) => {
  const s3 = getS3Client(s3Config);

  await setupBucket(s3, bucketName);

  const { stream: fileStream, fileName, size } = await createTempStream(
    fileSizeInMb,
  );

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: fileStream,
      ContentLength: size,
    },
  });

  b.start();

  const _res = await upload.done();

  b.end();
  s3.destroy();
};

Deno.bench("upload object with chunk: 5MB", async (b) => {
  await uploadInChunk(5, b); // 5MB file
});

// FIXME: bench not working above >= 10MB
// Deno.bench("upload object with chunk: 10MB", async (b) => {
//   await uploadInChunk(10, b); // 10MB file
// });

// Deno.bench("upload object with chunk: 20MB", async (b) => {
//   await uploadInChunk(20, b); // 20MB file
// });

// Deno.bench("upload object with chunk: 100MB", async (b) => {
//   await uploadInChunk(100, b); // 100MB file
// });

// Deno.bench("upload object with chunk: 1GB", async (b) => {
//   await uploadInChunk(1000, b); // 1GB file
// });

Deno.bench("List Objects", async (b) => {
  const s3 = getS3Client(s3Config);

  await setupBucket(s3, bucketName);
  await uploadMultipleFiles(s3, bucketName);

  b.start();
  const _res = await listObjects(s3, bucketName);
  b.end();
  s3.destroy();
});

Deno.bench("Get Object", async (b) => {
  const s3 = getS3Client(s3Config);

  const { stream: fileStream, fileName, size } = await createTempStream(2);

  await setupBucket(s3, bucketName);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: fileStream,
      ContentLength: size,
    },
  });

  const _res = await upload.done();

  const getObjectCmd = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });
  b.start();
  const _getResponse = await s3.send(getObjectCmd);
  b.end();
});

Deno.bench("Delete Object", async (b) => {
  const s3 = getS3Client(s3Config);

  const { stream: fileStream, fileName, size } = await createTempStream(2);

  await setupBucket(s3, bucketName);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: fileStream,
      ContentLength: size,
    },
  });

  const _res = await upload.done();

  const deleteObjCmd = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });
  b.start();
  const _deleteResponse = await s3.send(deleteObjCmd);
  b.end();
});
