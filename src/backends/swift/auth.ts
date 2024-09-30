import { SwiftConfig } from "../../config/types.ts";
import { HTTPException } from "../../types/http-exception.ts";
import { getLogger } from "../../utils/log.ts";
import { retryWithExponentialBackoff } from "../../utils/url.ts";

const logger = getLogger(import.meta);

export async function getAuthTokenWithTimeouts(config: SwiftConfig): Promise<{
  storageUrl: string;
  token: string;
}> {
  const getAuthToken = async () => {
    const { auth_url, credentials } = config;
    const { username, password } = credentials;

    logger.info("Fetching Authorization Token From Swift Server");
    logger.info("Fetching Storage URL From Swift Server");

    const response = await fetch(auth_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-auth-user": username,
        "x-auth-key": password,
      },
    });

    if (!response.ok) {
      logger.warn(
        `Failed to authenticate with the auth service: ${response.statusText}`,
      );
      throw new HTTPException(response.status, { res: response });
    }
    logger.info("Authorization Token and Storage URL retrieved Successfully");

    const storageUrl = response.headers.get("x-storage-url") as string;
    const token = response.headers.get("x-auth-token") as string;

    // TODO: cache the auth-token and storage url per username and password
    logger.debug(`Retrieved token ${token} and storage url ${storageUrl}`);

    return { storageUrl, token };
  };

  return await retryWithExponentialBackoff(
    getAuthToken,
    5,
    100,
    1000,
    config.container,
  );
}

export function getSwiftRequestHeaders(authToken: string): Headers {
  return new Headers({
    "X-Auth-Token": authToken,
    "Accept": "application/xml",
  });
}
