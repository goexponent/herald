import { writeAll } from "std/io/write_all.ts";
import { basename } from "std/path/mod.ts";

/**
 * Creates a temporary file of the specified size in megabytes.
 * @param sizeInMB - The size of the file to create in megabytes.
 * @returns The path to the created temporary file.
 */
export async function createTempFile(sizeInMB: number): Promise<string> {
  const sizeInBytes = sizeInMB * 1024 * 1024;

  const tempFile = await Deno.makeTempFile();

  const buffer = new Uint8Array(1024 * 1024); // 1 MB buffer
  for (let i = 0; i < buffer.length; i++) {
    // const randByteVal = getRandomInt(0, 255);
    const randByteVal = 2;
    buffer[i] = randByteVal;
  }

  const file = await Deno.open(tempFile, { write: true });

  // Write the buffer to the file repeatedly until the desired size is reached
  for (let written = 0; written < sizeInBytes; written += buffer.length) {
    await writeAll(file, buffer);
  }

  file.close();

  return tempFile;
}

/**
 * Represents a file stream.
 *
 * @remarks
 * This interface is used to describe a file stream, including the stream itself, the file name, and the size of the file.
 */
export interface FileStream {
  stream: ReadableStream;
  fileName: string;
  size: number;
}

/**
 * Creates a temporary stream with the specified size in megabytes.
 *
 * @param sizeInMb - The size of the temporary stream in megabytes. Default is 5.
 * @returns A promise that resolves to a FileStream object containing the stream, file name, and size.
 */
export async function createTempStream(
  sizeInMb = 5,
): Promise<FileStream> {
  const filePath = await createTempFile(sizeInMb);
  const fileName = basename(filePath);
  const fileInfo = await Deno.stat(filePath);
  const size = fileInfo.size;

  // Deno stream
  const file = await Deno.open(filePath, { read: true });
  const stream = file.readable;

  // Node Stream, doesn't work for now
  // const stream = fs.createReadStream(filePath);

  return {
    stream,
    fileName,
    size,
  } as FileStream;
}
