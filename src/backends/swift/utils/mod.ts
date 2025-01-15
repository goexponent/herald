import * as xml2js from "xml2js";

export function formatRFC3339Date(dateString: string): string {
  // Convert the string into a Date object
  const date = new Date(dateString);

  // Format the date as an RFC-3339 string without microseconds
  return date.toISOString().replace(/(\.\d{3})\d+Z$/, "$1Z");
}

interface JsonObject {
  [key: string]: string | JsonObject;
}

interface SwiftObject {
  name: string;
  last_modified: string;
  hash: string;
  bytes: number;
}

function getS3Object(item: SwiftObject) {
  return {
    Key: item.name,
    LastModified: formatRFC3339Date(item.last_modified),
    ETag: item.hash,
    Size: item.bytes,
    StorageClass: "STANDARD",
  };
}

interface Folder {
  subdir: string;
}

function instanceOfFolder(object: object): object is Folder {
  return "subdir" in object;
}

function extractCommonPrefixes(folders: object[]): string[] {
  const prefixes = new Set<string>();

  for (const folder of folders) {
    if (!instanceOfFolder(folder)) {
      continue;
    }
    const dir = folder.subdir;
    prefixes.add(dir);
  }

  return Array.from(prefixes);
}

export async function toS3XmlContent(
  swiftResponse: Response,
  bucket: string,
  delimiter?: string,
  prefix?: string,
  maxKeys = 1000,
  continuationToken?: string,
): Promise<Response> {
  const swiftBody = await swiftResponse.json();

  // Transforming Swift's JSON response to S3's XML format
  const contents = [];
  for (const item of swiftBody) {
    if (!item.name) {
      continue;
    }
    contents.push(getS3Object(item));
  }

  const commonPrefixes = delimiter ? extractCommonPrefixes(swiftBody) : [];

  const s3FormattedBody = {
    ListBucketResult: {
      Name: bucket,
      Prefix: prefix,
      Delimiter: delimiter || "",
      MaxKeys: maxKeys,
      IsTruncated: swiftBody.length === maxKeys,
      Contents: contents,
      CommonPrefixes: commonPrefixes.map((prefix) => ({ Prefix: prefix })),
      KeyCount: commonPrefixes.length + contents.length,
      ContinuationToken: continuationToken,
      NextContinuationToken: contents.length !== 0
        ? contents[contents.length - 1].Key
        : (commonPrefixes.length !== 0
          ? commonPrefixes[commonPrefixes.length - 1]
          : undefined),
    },
  };

  const xmlBuilder = new xml2js.Builder();
  const formattedXml = xmlBuilder.buildObject(s3FormattedBody);

  return new Response(formattedXml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
