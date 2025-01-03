import { decode, verify } from "jwt";
import { envVarsConfig, globalConfig } from "../config/mod.ts";
import { getLogger } from "../utils/log.ts";
import { retryFetchWithExponentialBackoff } from "../utils/url.ts";
import { HTTPException } from "../types/http-exception.ts";
import { HTTP_STATUS_CODES } from "../constants/http_status_codes.ts";

interface DecodedToken {
  sub: string;
  "kubernetes.io"?: {
    serviceaccount: {
      name: string;
      uid: string;
    };
  };
}

interface JWK {
  kid: string;
  use: string;
  kty: string;
  alg: string;
  n: string;
  e: string;
}

const logger = getLogger(import.meta);

export async function verifyServiceAccountToken(
  token: string,
): Promise<string> {
  const payload = await verifyToken(token);

  if (
    !payload["kubernetes.io"] || !payload["kubernetes.io"].serviceaccount.name
  ) {
    const message = "Payload does not contain service account name field";
    logger.error(message);
    throw new HTTPException(HTTP_STATUS_CODES.UNAUTHORIZED, {
      message,
    });
  }

  return payload["kubernetes.io"].serviceaccount.name;
}

let jwks: JWK[] | undefined;
const jwkExpiration = 24 * 60 * 60 * 1000; // 24 hours
let expirationTime = Date.now() + jwkExpiration;

function isJWKExpired(): boolean {
  return Date.now() > expirationTime;
}

const cryptoKeys: Map<string, CryptoKey> = new Map();
async function verifyToken(token: string): Promise<DecodedToken> {
  if (!jwks || isJWKExpired()) {
    jwks = await getKeys();
  }

  const header = decode(token)[0];
  const kid = (header as { kid?: string })?.kid;
  if (!kid) {
    const message = "Missing kid in token header";
    logger.error(message);
    throw new HTTPException(401, { message });
  }
  const matchingKey = jwks.find((k) => k.kid === kid);
  if (!matchingKey) {
    const message = "Key not found for kid in JWKs";
    logger.error(message);
    throw new HTTPException(401, { message });
  }
  const key = JSON.stringify(matchingKey);

  const cryptoKey = cryptoKeys.has(kid)
    ? cryptoKeys.get(kid)!
    : await crypto.subtle.importKey(
      "jwk",
      JSON.parse(key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"],
    );

  if (!cryptoKeys.has(kid)) {
    cryptoKeys.set(kid, cryptoKey);
  }

  const verified = await verify(token, cryptoKey);
  return verified as DecodedToken;
}

async function getKeys(): Promise<JWK[]> {
  const jwks_uri = await getJWKURI();
  const jwkUrl = new URL(jwks_uri);
  const headers = new Headers();
  if (envVarsConfig.env === "DEV") {
    // This should be the proxy server created by kubectl for dev purposes inside a local machine
    jwkUrl.hostname = envVarsConfig.k8s_api;
  } else {
    // we need to set the auth headers with the serviceToken when herald is running in a k8s cluster
    headers.set(
      "Authorization",
      `Bearer ${await getServiceAccountToken()}`,
    );
  }
  const fetchFunc = async () => await fetch(jwkUrl.toString(), { headers });
  const fetchJWK = await retryFetchWithExponentialBackoff(fetchFunc, 5, 1000);

  if (fetchJWK instanceof Error) {
    logger.error(fetchJWK.message);
    throw new HTTPException(500, { message: fetchJWK.message });
  }

  const data = await fetchJWK.json();
  const keys = data.keys;
  if (!keys) {
    const message = "Keys not found in the JWK response";
    logger.error(message);
    throw new HTTPException(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, {
      message,
    });
  }
  expirationTime = Date.now() + jwkExpiration;

  return keys as JWK[];
}

async function getJWKURI(): Promise<string> {
  const k8s_url = envVarsConfig.k8s_api;
  const fetchFunc = async () =>
    await fetch(
      `${k8s_url}/.well-known/openid-configuration`,
      {
        headers: {
          Authorization: `Bearer ${await getServiceAccountToken()}`,
        },
      },
    );
  const fetchJWKURI = await retryFetchWithExponentialBackoff(
    fetchFunc,
    5,
    1000,
  );

  if (fetchJWKURI instanceof Error) {
    logger.error(fetchJWKURI.message);
    throw new HTTPException(500, { message: fetchJWKURI.message });
  }

  const data = await fetchJWKURI.json();
  const jwks_uri = data.jwks_uri;

  if (!jwks_uri) {
    const message = "JWKS URI not found in response";
    logger.error(message);
    throw new HTTPException(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, { message });
  }

  return jwks_uri;
}

async function getServiceAccountToken(): Promise<string> {
  const token = await Deno.readFile(
    "/var/run/secrets/kubernetes.io/serviceaccount/token",
  );
  return new TextDecoder().decode(token);
}

export function hasBucketAccess(
  serviceAccount: string,
  bucket: string,
): boolean {
  const sa = globalConfig.service_accounts.find((sa) =>
    sa.name === serviceAccount
  );
  if (!sa) {
    throw new HTTPException(401, { message: "Service Account not found" });
  }

  return sa.buckets.includes(bucket);
}
