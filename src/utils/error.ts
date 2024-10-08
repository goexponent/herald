import { getRandomUUID } from "./crypto.ts";

function errorToXmlResponse(error: Error, resource: string): string {
  // Extract error details
  const errorCode = error.name || "InternalError"; // Default error code if not specified
  const errorMessage = error.message || "An unknown error occurred.";
  const requestId = getRandomUUID();
  const hostId = undefined;

  // Construct XML error response string
  const xmlResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Error>
        <Code>${errorCode}</Code>
        <Message>${errorMessage}</Message>
        <Resource>${resource}</Resource>
        <RequestId>${requestId}</RequestId>
        <HostId>${hostId}</HostId>
      </Error>
    `.trim();

  return xmlResponse;
}

// Function to create a Response object with XML content type
export function createXmlErrorResponse(
  error: Error,
  httpStatusCode = 400,
  resource: string,
): Response {
  const xmlResponse = errorToXmlResponse(error, resource);

  // Create a Response object with the XML response body and set headers
  return new Response(xmlResponse, {
    status: httpStatusCode,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
