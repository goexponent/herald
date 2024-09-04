import * as xml2js from "xml2js";

function formatRFC3339Date(dateString: string): string {
  // Convert the string into a Date object
  const date = new Date(dateString);

  // Format the date as an RFC-3339 string without microseconds
  return date.toISOString().replace(/(\.\d{3})\d+Z$/, "$1Z");
}

interface JsonObject {
  [key: string]: string | JsonObject;
}

function getContent(data: JsonObject) {
  if (!data.object) {
    return [];
  }

  const objectsList = Array.isArray(data.object) ? data.object : [data.object];
  return objectsList.map((obj) => ({
    Key: obj.name[0],
    LastModified: formatRFC3339Date(obj.last_modified[0]),
    ETag: obj.hash[0],
    Size: obj.bytes[0],
    StorageClass: "STANDARD",
  }));
}

export async function toS3XmlContent(
  swiftResponse: Response,
): Promise<Response> {
  const swiftBody = await swiftResponse.text();

  // Parse Swift JSON/XML response
  const xmlParser = new xml2js.Parser();
  const parsedBody = await xmlParser.parseStringPromise(swiftBody);

  // Transform the parsed body to match S3 XML format
  const data = parsedBody.container;
  const s3FormattedBody = {
    ListBucketResult: {
      Name: data["$"].name,
      Contents: getContent(data),
    },
  };

  const xmlBuilder = new xml2js.Builder();
  const formattedXml = xmlBuilder.buildObject(s3FormattedBody);
  return new Response(formattedXml, swiftResponse);
}
