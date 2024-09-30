import { HTTPException } from "../types/http-exception.ts";

const commonHeaders = {
  "Content-Type": "application/xml",
};

// xml error responses
const noSuchBucketXml = `<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchBucket</Code>
  <Message>The specified bucket does not exist</Message>
  <BucketName>example-bucket</BucketName>
  <RequestId>EXAMPLE123456789</RequestId>
  <HostId>EXAMPLEhostIDString1234567890123456789012345678901234567890</HostId>
</Error>`;

// Exceptions
export function NoSuchBucketException() {
  return new HTTPException(404, {
    res: new Response(noSuchBucketXml, {
      status: 404,
      headers: commonHeaders,
    }),
  });
}

export function NotImplementedException() {
  return new HTTPException(501, {
    message: "Method Not Implemented.",
  });
}

export function MethodNotAllowedException(method: string) {
  return new HTTPException(405, {
    res: new Response(
      `<Error><Code>MethodNotAllowed</Code><Message>The specified method is not allowed against this resource.</Message><Method>${method}</Method><ResourceType>Bucket</ResourceType><RequestId>EXAMPLE123456789</RequestId><HostId>EXAMPLEhostIDString1234567890123456789012345678901234567890</HostId></Error>`,
      {
        status: 405,
        headers: commonHeaders,
      },
    ),
  });
}
