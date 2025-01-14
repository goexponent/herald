import { decode, verify } from "djwt";
import { envVarsConfig, globalConfig } from "../config/mod.ts";
import { getLogger } from "../utils/log.ts";
import { retryFetchWithTimeout } from "../utils/url.ts";
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

/**
 * Interface representing a JSON Web Key (JWK) structure for "kube" JWT.
 *
 * @property {string} kid - Key ID
 * @property {string} use - Public Key Use
 * @property {string} kty - Key Type
 * @property {string} alg - Algorithm
 * @property {string} n - Modulus
 * @property {string} e - Exponent
 */
interface KubeJWK {
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

  const name = payload["kubernetes.io"]?.serviceaccount?.name;
  if (
    !name
  ) {
    const message = "Payload does not contain service account name field";
    logger.error(message);
    throw new HTTPException(HTTP_STATUS_CODES.UNAUTHORIZED, {
      message,
    });
  }

  return name;
}

const jwkExpiration = 24 * 60 * 60 * 1000; // 24 hours
let expirationTime = Date.now() + jwkExpiration;

const cryptoKeys: Map<string, CryptoKey> = new Map();

async function updateKeyCache() {
  const jwks = await getKeys();
  jwks.forEach(async (key) => {
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"],
    );
    cryptoKeys.set(key.kid, cryptoKey);
  });
}

async function verifyToken(token: string): Promise<DecodedToken> {
  if (cryptoKeys.size === 0 || Date.now() > expirationTime) {
    await updateKeyCache();
  }
  let header: { kid?: string };
  try {
    header = decode(token)[0] as { kid?: string };
  } catch (e) {
    const message = `Error decoding token: ${(e as Error).message}`;
    logger.error(message);
    throw new HTTPException(401, { message });
  }
  const kid = header.kid;
  if (!kid) {
    const message = "Missing kid in token header";
    logger.error(message);
    throw new HTTPException(401, { message });
  }

  const cryptoKey = cryptoKeys.get(kid);
  if (!cryptoKey) {
    const message = `Key with kid ${kid} not found`;
    logger.error(message);
    throw new HTTPException(401, { message });
  }

  const verified = await verify(token, cryptoKey);
  return verified as DecodedToken;
}

async function getKeys(): Promise<KubeJWK[]> {
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
  const fetchJWK = await retryFetchWithTimeout(
    fetchFunc,
    5,
    1000,
  );

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

  return keys as KubeJWK[];
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
  const fetchJWKURI = await retryFetchWithTimeout(
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
